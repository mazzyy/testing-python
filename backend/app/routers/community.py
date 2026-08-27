"""
API Router for Community Feature
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.community import Post, Comment, Vote, VoteType, SavedPost
from app.schemas.community import PostCreate, PostUpdate, PostResponse, PostDetailResponse, CommentCreate, CommentResponse, VoteCreate
from app.auth import get_current_user, get_optional_current_user
from app.services.notification_service import get_notification_service
from app.models.notification import NotificationType, NotificationPriority

router = APIRouter(
    prefix="/community",
    tags=["Community"]
)

# Helper function to build comment tree
def build_comment_tree(comments):
    comment_map = {c.id: CommentResponse.model_validate(c) for c in comments}
    root_comments = []
    
    for comment in comments:
        c_resp = comment_map[comment.id]
        # Calculate votes
        c_resp.vote_count = sum(v.value for v in comment.votes)
        
        if comment.parent_id:
            if comment.parent_id in comment_map:
                parent = comment_map[comment.parent_id]
                parent.replies.append(c_resp)
        else:
            root_comments.append(c_resp)
            
    return root_comments

@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("newest", enum=["newest", "popular"]),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    import json
    query = db.query(Post)
    
    if search:
        query = query.filter(Post.title.ilike(f"%{search}%"))

    if category:
        query = query.filter(Post.category == category)
    
    if tag:
        # Check against the JSON string case-insensitively
        from sqlalchemy import func
        query = query.filter(func.lower(Post.tags).like(f'%"{tag.lower()}"%'))
        
    if sort_by == "newest":
        query = query.order_by(Post.created_at.desc())
    # Note: "popular" sorting needs joing with votes, simplified for now to just created_at or manual logic
    # Implementing basic popular sort by vote count would require cleaner SQL query, logic:
    # query = query.outerjoin(Vote).group_by(Post.id).order_by(func.sum(Vote.value).desc())
    # For MVP, stick to newest or simple iteration if dataset is small, but let's try to add basic support later.
    
    posts = query.offset(skip).limit(limit).all()
    
    # Pre-fetch saved posts for current user
    saved_post_ids = set()
    if current_user:
        saved = db.query(SavedPost).filter(SavedPost.user_id == current_user.id).all()
        saved_post_ids = {s.post_id for s in saved}

    response = []
    for post in posts:
        post_data = PostResponse.model_validate(post)
        post_data.vote_count = sum(v.value for v in post.votes)
        post_data.comment_count = len(post.comments)
        
        if current_user:
            user_vote = next((v for v in post.votes if v.user_id == current_user.id), None)
            if user_vote:
                post_data.user_vote = user_vote.value
            
            if post.id in saved_post_ids:
                post_data.is_saved = True
                
        response.append(post_data)
        
    return response

@router.post("/posts", response_model=PostResponse)
def create_post(
    post: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import json
    import re

    # Extract hashtags from content
    # Find words starting with #, allowing alphanumeric and underscore, but not starting from non-whitespace
    hashtags = re.findall(r'(?:^|\s)#(\w+)', post.content)
    # Deduplicate, clean, and lowercase
    unique_tags = list(set(tag.lower() for tag in hashtags))
    
    tags_json = json.dumps(unique_tags)
    
    new_post = Post(
        title=post.title,
        content=post.content,
        category=post.category,
        tags=tags_json,
        author_id=current_user.id
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    # Process mentions
    process_mentions(db, new_post, current_user)

    # Convert tags back to list for response
    # Convert tags back to list for response
    response = PostResponse.model_validate(new_post)
    return response

@router.put("/posts/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post_update: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import json
    import re

    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Only the author or an admin can edit
    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")

    if post_update.title is not None:
        post.title = post_update.title
    if post_update.content is not None:
        post.content = post_update.content
        # Re-extract hashtags from updated content
        hashtags = re.findall(r'(?:^|\s)#(\w+)', post.content)
        unique_tags = list(set(tag.lower() for tag in hashtags))
        post.tags = json.dumps(unique_tags)
    if post_update.category is not None:
        post.category = post_update.category
    if post_update.tags is not None:
        post.tags = json.dumps(post_update.tags)

    db.commit()
    db.refresh(post)

    response = PostResponse.model_validate(post)
    response.vote_count = sum(v.value for v in post.votes)
    response.comment_count = len(post.comments)
    return response

@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Only the author or an admin can delete
    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.delete(post)  # Cascade deletes comments, votes, saved_posts
    db.commit()
    return {"status": "deleted"}

def process_mentions(db: Session, post: Post, author: User):
    import re
    # Simple regex for @username
    mentions = re.findall(r'@(\w+)', post.content)
    for username in set(mentions):
        user = db.query(User).filter(User.username == username).first()
        if user and user.id != author.id:
            get_notification_service().create_notification(
                db=db,
                user_id=user.id,
                notification_type=NotificationType.COMMUNITY_REPLY, # Using REPLY type for now or add MENTION type
                title="You were mentioned",
                message=f"{author.username} mentioned you in: {post.title[:30]}...",
                link=f"/community/posts/{post.id}",
                priority=NotificationPriority.MEDIUM
            )

@router.get("/posts/{post_id}", response_model=PostDetailResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    import json
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    post_resp = PostDetailResponse.model_validate(post)
    post_resp.vote_count = sum(v.value for v in post.votes)
    
    if current_user:
        user_vote = next((v for v in post.votes if v.user_id == current_user.id), None)
        if user_vote:
            post_resp.user_vote = user_vote.value
        
        # Check if saved
        is_saved = db.query(SavedPost).filter(
            SavedPost.user_id == current_user.id,
            SavedPost.post_id == post.id
        ).first()
        if is_saved:
            post_resp.is_saved = True

    # Build comments
    comments = db.query(Comment).filter(Comment.post_id == post_id).all()
    
    # Efficiently map user votes for comments
    user_comment_votes = {}
    if current_user:
        votes = db.query(Vote).filter(
            Vote.user_id == current_user.id,
            Vote.comment_id.in_([c.id for c in comments])
        ).all()
        user_comment_votes = {v.comment_id: v.value for v in votes}

    comment_map = {}
    root_comments = []

    for comment in comments:
        c_resp = CommentResponse.model_validate(comment)
        c_resp.replies = [] # Clear ORM-loaded replies to prevent duplication
        c_resp.vote_count = sum(v.value for v in comment.votes)
        if current_user and comment.id in user_comment_votes:
            c_resp.user_vote = user_comment_votes[comment.id]
        
        comment_map[comment.id] = c_resp
    
    # Second pass for structure
    for comment in comments:
        c_resp = comment_map[comment.id]
        if comment.parent_id and comment.parent_id in comment_map:
            parent = comment_map[comment.parent_id]
            parent.replies.append(c_resp)
        else:
            root_comments.append(c_resp)
            
    post_resp.comments = root_comments
    return post_resp

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def create_comment(
    post_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if comment.parent_id:
        parent = db.query(Comment).filter(Comment.id == comment.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")
            
    new_comment = Comment(
        content=comment.content,
        post_id=post_id,
        author_id=current_user.id,
        parent_id=comment.parent_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # Notify post author if not self
    if post.author_id != current_user.id:
        get_notification_service().create_notification(
            db=db,
            user_id=post.author_id,
            notification_type=NotificationType.COMMUNITY_REPLY,
            title="New comment on your post",
            message=f"{current_user.username} commented on: {post.title[:30]}...",
            link=f"/community/posts/{post.id}",
            priority=NotificationPriority.MEDIUM
        )

    # Notify parent comment author if reply and not self
    if comment.parent_id and parent and parent.author_id != current_user.id and parent.author_id != post.author_id:
         get_notification_service().create_notification(
            db=db,
            user_id=parent.author_id,
            notification_type=NotificationType.COMMUNITY_REPLY,
            title="New reply to your comment",
            message=f"{current_user.username} replied to your comment on: {post.title[:30]}...",
            link=f"/community/posts/{post.id}",
            priority=NotificationPriority.MEDIUM
        )
    
    # Process mentions in comment
    import re
    mentions = re.findall(r'@(\w+)', comment.content)
    for username in set(mentions):
        user = db.query(User).filter(User.username == username).first()
        if user and user.id != current_user.id:
            get_notification_service().create_notification(
                db=db,
                user_id=user.id,
                notification_type=NotificationType.COMMUNITY_REPLY,
                title="You were mentioned",
                message=f"{current_user.username} mentioned you in a comment",
                link=f"/community/posts/{post.id}",
                priority=NotificationPriority.MEDIUM
            )
    
    return new_comment

@router.post("/vote", response_model=dict)
def vote(
    vote_in: VoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not vote_in.post_id and not vote_in.comment_id:
        raise HTTPException(status_code=400, detail="Must allow vote on post or comment")
        
    query = db.query(Vote).filter(Vote.user_id == current_user.id)
    if vote_in.post_id:
        query = query.filter(Vote.post_id == vote_in.post_id)
    else:
        query = query.filter(Vote.comment_id == vote_in.comment_id)
        
    existing_vote = query.first()
    
    if existing_vote:
        if existing_vote.value == vote_in.value:
            # Toggle off (remove vote)
            db.delete(existing_vote)
            db.commit()
            return {"status": "removed"}
        else:
            # Change vote
            existing_vote.value = vote_in.value
            db.commit()
            return {"status": "updated"}
    else:
        new_vote = Vote(
            user_id=current_user.id,
            value=vote_in.value,
            post_id=vote_in.post_id,
            comment_id=vote_in.comment_id
        )
        db.add(new_vote)
        db.commit()

        # Notify author of like (only for clean upvotes)
        if vote_in.value == 1:
            target_author_id = None
            target_title = "content"
            link = ""

            if vote_in.post_id:
                target_post = db.query(Post).filter(Post.id == vote_in.post_id).first()
                if target_post:
                    target_author_id = target_post.author_id
                    target_title = f"post: {target_post.title[:20]}..."
                    link = f"/community/posts/{target_post.id}"
            elif vote_in.comment_id:
                target_comment = db.query(Comment).filter(Comment.id == vote_in.comment_id).first()
                if target_comment:
                    target_author_id = target_comment.author_id
                    target_title = "your comment"
                    # Ideally deep link to comment, but post link is fine
                    link = f"/community/posts/{target_comment.post_id}"

            if target_author_id and target_author_id != current_user.id:
                 get_notification_service().create_notification(
                    db=db,
                    user_id=target_author_id,
                    notification_type=NotificationType.COMMUNITY_LIKE,
                    title="New like",
                    message=f"{current_user.username} liked {target_title}",
                    link=link,
                    priority=NotificationPriority.LOW
                )

        return {"status": "created"}

@router.post("/posts/{post_id}/save", response_model=dict)
def save_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    existing = db.query(SavedPost).filter(
        SavedPost.user_id == current_user.id,
        SavedPost.post_id == post_id
    ).first()
    
    if existing:
        return {"status": "already_saved"}
        
    saved = SavedPost(user_id=current_user.id, post_id=post_id)
    db.add(saved)
    db.commit()
    return {"status": "saved"}

@router.delete("/posts/{post_id}/save", response_model=dict)
def unsave_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    saved = db.query(SavedPost).filter(
        SavedPost.user_id == current_user.id,
        SavedPost.post_id == post_id
    ).first()
    
    if saved:
        db.delete(saved)
        db.commit()
        return {"status": "unsaved"}
    
    return {"status": "not_found"}

@router.get("/saved-posts", response_model=List[PostResponse])
def get_saved_posts(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import json
    saved_posts = db.query(SavedPost).filter(SavedPost.user_id == current_user.id)\
        .order_by(SavedPost.created_at.desc())\
        .offset(skip).limit(limit).all()
        
    response = []
    for saved in saved_posts:
        post = saved.post
        post_data = PostResponse.model_validate(post)
        post_data.vote_count = sum(v.value for v in post.votes)
        post_data.comment_count = len(post.comments)
        post_data.is_saved = True
        
        user_vote = next((v for v in post.votes if v.user_id == current_user.id), None)
        if user_vote:
            post_data.user_vote = user_vote.value
                
        response.append(post_data)
        
    return response

@router.get("/debug-search")
def debug_search(
    tag: str,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    import json
    
    # 1. Raw search for term in lowercase
    term = tag.lower()
    
    # 2. Logic we rely on
    query = db.query(Post).filter(func.lower(Post.tags).like(f'%"{term}"%'))
    results = query.all()
    
    # 3. Check what's actually in DB for these
    debug_info = []
    for p in results:
        debug_info.append({
            "id": p.id,
            "title": p.title,
            "tags_raw": p.tags,
            "matched_term": term
        })
        
    # 4. Also return ALL posts with tags to see what they look like
    all_tagged = db.query(Post).filter(Post.tags != None).limit(10).all()
    all_samples = [{"id": p.id, "tags": p.tags} for p in all_tagged]
    
    return {
        "searched_tag": tag,
        "results": debug_info,
        "sample_db_tags": all_samples
    }
