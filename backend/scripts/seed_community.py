#!/usr/bin/env python3
"""
Seed demo community content: users, posts, threaded comments and votes.

Every account uses the non-routable @demo.campusconsult.local domain, so demo
content is identifiable in one query and removable with --clear.

Usage:
    cd backend
    python -m scripts.seed_community --db-url "postgresql://...:5433/uniadvisor_db"
    python -m scripts.seed_community --clear --db-url "..."
"""

import os
import sys
import random
import argparse
from pathlib import Path
from datetime import datetime, timedelta, timezone

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

load_dotenv(backend_dir / ".env")

DEMO_DOMAIN = "demo.campusconsult.local"
DEMO_PASSWORD = "demo1234"

# A vote is a row tied to a distinct user, so the pool has to be larger than the
# highest vote count or every post clamps to the same number.
PEOPLE = [
    ("Ayesha Khan", "ayesha_k"), ("Tobi Adeyemi", "tobi_ade"), ("Rahul Menon", "rahul_m"),
    ("Mai Nguyen", "mai_nguyen"), ("Youssef Hassan", "youssef_h"), ("Fatima Zahra", "fatima_z"),
    ("Deniz Yilmaz", "deniz_y"), ("Arif Rahman", "arif_r"), ("Priya Raghavan", "priya_r"),
    ("Bagus Santoso", "bagus_s"), ("Nadia Iqbal", "nadia_i"), ("Kwame Mensah", "kwame_m"),
    ("Sara Haddad", "sara_h"), ("Vikram Nair", "vikram_n"), ("Linh Tran", "linh_t"),
    ("Omar Farouk", "omar_f"), ("Zainab Ali", "zainab_a"), ("Emeka Okafor", "emeka_o"),
    ("Hina Sheikh", "hina_s"), ("Chidi Nwosu", "chidi_n"), ("Anjali Desai", "anjali_d"),
    ("Mehmet Kaya", "mehmet_k"), ("Rina Putri", "rina_p"), ("Karim Bouazizi", "karim_b"),
    ("Sneha Pillai", "sneha_p"), ("Thanh Le", "thanh_le"), ("Bilal Ahmed", "bilal_a"),
    ("Grace Wanjiru", "grace_w"), ("Aditya Sharma", "aditya_s"), ("Noor Fatima", "noor_f"),
    ("Ravi Krishnan", "ravi_k"), ("Amina Diallo", "amina_d"), ("Hasan Celik", "hasan_c"),
    ("Dewi Lestari", "dewi_l"), ("Imran Malik", "imran_m"), ("Tunde Bakare", "tunde_b"),
    ("Meera Joshi", "meera_j"), ("Quang Pham", "quang_p"), ("Layla Mansour", "layla_m"),
    ("Sadia Haque", "sadia_h"), ("Nikhil Rao", "nikhil_r"), ("Ebube Chukwu", "ebube_c"),
    ("Farah Siddiqui", "farah_s"), ("Duc Hoang", "duc_h"), ("Kofi Asante", "kofi_a"),
    ("Ishaan Verma", "ishaan_v"), ("Rania Saleh", "rania_s"), ("Putri Handayani", "putri_h"),
]

# title, category, tags, body, author, days_ago, upvotes
POSTS = [
    ("uni-assist rejected my documents twice — here's what actually fixed it", "Admissions",
     "uni-assist,documents,transcripts",
     "Two rejections, both for the same reason I only understood on the third try.\n\n"
     "First time: I uploaded my transcript but not the grading key from the back of the document. "
     "They want the page explaining what the maximum grade is, otherwise they cannot convert anything.\n\n"
     "Second time: my degree certificate was certified by a notary, but the stamp did not include the "
     "notary's own name in Latin script. They would not accept it.\n\n"
     "Third attempt went through in 9 days. If you are stuck, look at what is missing around the "
     "document, not the document itself.", "ayesha_k", 74, 41),

    ("APS certificate timeline for Pakistan — my actual dates", "Admissions", "aps,pakistan,timeline",
     "Posting real dates because every blog I read was vague.\n\n"
     "Applied online: 3 Feb. Documents received: 11 Feb. Interview invitation: 6 March. Interview: "
     "19 March, about 20 minutes, purely about my thesis and two core subjects. Certificate posted: 2 April.\n\n"
     "Roughly two months door to door. Do not book anything around the interview date.", "fatima_z", 68, 37),

    ("Blocked account: Expatrio vs Fintiba vs Deutsche Bank, one year later", "Visa",
     "blocked-account,finances,visa",
     "I have now used two of the three so I can compare properly.\n\n"
     "Fintiba was faster to open, same day confirmation, but the monthly fee adds up. Expatrio bundled "
     "health insurance which made the visa paperwork simpler because it is one PDF instead of two.\n\n"
     "The required amount is set per year and it went up again, so check the current figure on the "
     "Auswärtiges Amt page rather than any video from last year.\n\n"
     "Whichever you pick, open it before your visa appointment, not after.", "youssef_h", 61, 44),

    ("Got my TU Berlin admission today — GPA was not the deciding factor", "Admissions",
     "tu-berlin,admission,masters",
     "3.1/4.0 undergrad, which I was convinced would disqualify me.\n\n"
     "What I think carried it: two years of relevant work experience, and a motivation letter about a "
     "specific research group rather than 'Germany has strong engineering'.\n\n"
     "7 applications, 2 offers, 3 rejections, 2 never replied. Apply wider than feels comfortable.",
     "rahul_m", 57, 46),

    ("Wohnungssuche in Munich is genuinely brutal — 63 applications", "Housing",
     "munich,housing,wg-gesucht",
     "63 messages on WG-Gesucht, 6 replies, 2 viewings, 1 room.\n\n"
     "What changed my reply rate: writing in German even though mine is bad, attaching a short PDF with "
     "photo, enrolment certificate and Schufa substitute, and messaging within 20 minutes of a listing.\n\n"
     "I paid for two weeks in a hostel and that was the right call versus signing something unseen. "
     "Never transfer a deposit before a viewing.", "mai_nguyen", 52, 47),

    ("Anmeldung appointment in under a week — Bürgeramt trick", "Student Life",
     "anmeldung,bureaucracy,berlin",
     "Everyone says wait six weeks. Two things are not obvious.\n\n"
     "Appointments are released very early in the morning and cancellations appear all day, so refresh "
     "at odd hours.\n\n"
     "You are not restricted to the office nearest you. Any Bürgeramt in the city works, and the outer "
     "districts had slots when the central ones showed nothing for two months.\n\n"
     "Bring the Wohnungsgeberbestätigung or you will be sent home.", "deniz_y", 48, 39),

    ("Working student job while doing a Master's — what it's actually like", "Jobs",
     "werkstudent,part-time,balance",
     "20 hours a week during semester, and it is more than it sounds.\n\n"
     "€16/hour covered rent and food but not much else. The bigger benefit was that my German improved "
     "faster in three months of standups than in a year of classes.\n\n"
     "Careful with the 120-day rule if you are non-EU and not on a Werkstudent contract. Get the "
     "contract type in writing.", "kwame_m", 44, 28),

    ("Do I need German for an English-taught Master's? Honest answer: sort of", "Student Life",
     "language,german,b1",
     "The programme is fully English and I have never needed German in a lecture.\n\n"
     "But my rental contract, Anmeldung, bank letters, doctor, insurance and every official email are in "
     "German. A2 gets you through daily life. B1 makes the bureaucracy stop being frightening.\n\n"
     "Start before you arrive. The first two months are when you need it most and have the least time.",
     "arif_r", 40, 43),

    ("Visa appointment wait times right now — add yours", "Visa", "visa,appointment,embassy",
     "Slots are the bottleneck, not the decision. Add yours with city and month.\n\n"
     "Cairo: booked June, appointment September, decision 5 weeks after.\n\n"
     "Nobody told me the embassy does not care about your enrolment deadline. Start the day your offer lands.",
     "youssef_h", 36, 35),

    ("PhD position vs enrolled doctorate — I picked wrong first", "Admissions", "phd,research,funding",
     "I spent four months applying to advertised PhD positions before understanding that many German "
     "doctorates are not advertised jobs at all.\n\n"
     "You find a supervisor, agree a topic, and enrol. Funding comes separately through a scholarship or "
     "a chair's project money.\n\n"
     "Once I emailed professors directly with a two-page proposal instead of applying to portals, I had "
     "three conversations within a month. Email during the semester break.", "priya_r", 33, 40),

    ("Studienkolleg: who actually needs it and who doesn't", "Admissions", "studienkolleg,bachelor,feststellungsprüfung",
     "Confusing because it depends entirely on your home country's school system.\n\n"
     "My 12-year schooling was not considered equivalent, so I needed a year of Studienkolleg plus the "
     "Feststellungsprüfung. A friend from the same country with one year of university already completed "
     "skipped it entirely.\n\n"
     "Check the anabin database for your specific qualification before assuming either way.", "bilal_a", 30, 22),

    ("Health insurance: public vs private as a student over 30", "Student Life",
     "insurance,tk,over-30",
     "Turning 30 changes this and nobody warns you.\n\n"
     "Under 30 you get the student rate with TK, AOK or similar. Over 30 you are pushed to voluntary "
     "public insurance at roughly triple, or private.\n\n"
     "I went private for two years. It was cheaper monthly but switching back to public later is very "
     "hard. Think about whether you intend to stay.", "vikram_n", 27, 31),

    ("Rejected from 5 programs — posting what the feedback actually said", "Admissions",
     "rejection,feedback,masters",
     "Nobody posts these so the base rate looks better than it is.\n\n"
     "Two said my bachelor did not contain enough ECTS in the core subject. One said the language "
     "certificate was the wrong type. Two gave no reason at all.\n\n"
     "The ECTS one was fixable — I took two online modules and reapplied the next intake and got in. "
     "Ask for the reason, some of them tell you.", "zainab_a", 24, 33),

    ("Semester ticket is the most underrated thing about studying here", "Student Life",
     "semester-ticket,transport,budget",
     "My semester contribution is about €350 and includes regional transport for six months.\n\n"
     "I have not bought a single train ticket for anything within the state. It changed how I think about "
     "weekends entirely.\n\n"
     "Check what your specific university's ticket covers, it varies a lot by state.", "linh_t", 21, 26),

    ("Sperrkonto money arrived late and almost cost me the semester", "Visa",
     "blocked-account,transfer,deadline",
     "The transfer from my home bank took 11 working days, not the 3 the provider suggested.\n\n"
     "Between the intermediary bank and a compliance hold, my confirmation came two days before the "
     "appointment. I have never been so stressed.\n\n"
     "Start the transfer at least three weeks before you need the confirmation.", "omar_f", 19, 29),

    ("Anyone else find the first semester lonelier than expected?", "Student Life",
     "mental-health,community,first-semester",
     "Academically fine. Socially much harder than I imagined.\n\n"
     "Everyone in my cohort already had friends from their bachelor, and the German habit of keeping work "
     "and social life separate took me months to understand — it is not coldness.\n\n"
     "What helped: joining a Hochschulsport course, and the international student group that meets weekly. "
     "Turning up repeatedly is the whole trick.", "sneha_p", 17, 38),

    ("Tuition-free does not mean cost-free — my real monthly budget", "Student Life",
     "budget,cost-of-living,finances",
     "Leipzig, shared flat, first year.\n\n"
     "Rent 340, insurance 125, phone 15, transport included in semester ticket, groceries around 220, "
     "everything else 150. Semester contribution about 250 twice a year.\n\n"
     "Around 850 a month without travel. Munich friends pay 400 more for rent alone.", "grace_w", 15, 34),

    ("Got a Werkstudent role at a company that does not speak English", "Jobs",
     "werkstudent,german,workplace",
     "I applied thinking my B1 was borderline. The interview was in German and I understood maybe 60%.\n\n"
     "They hired me anyway and said they cared more about whether I would keep trying. Six months later "
     "I run parts of meetings.\n\n"
     "Apply to the German-speaking roles. The bar is lower than you think if you are visibly willing.",
     "hasan_c", 13, 24),

    ("Thesis supervision — how to actually get a professor to respond", "Admissions",
     "thesis,supervisor,research",
     "Three unanswered emails, then one that got a reply in two hours.\n\n"
     "The difference: I referenced a specific paper of theirs from the last two years, said what I "
     "disagreed with, and proposed a concrete question. One paragraph.\n\n"
     "Generic 'I am interested in your research area' emails go straight in the bin.", "aditya_s", 11, 30),

    ("Bringing a spouse on a student visa — what we learned", "Visa",
     "family,spouse,visa",
     "Possible but slower than the student visa itself.\n\n"
     "We had to show additional funds beyond my blocked account, a marriage certificate with apostille, "
     "and my wife needed A1 German for the family reunion visa.\n\n"
     "Ours took about four months after mine was approved. Start both processes at the same time, not "
     "sequentially like we did.", "imran_m", 9, 27),

    ("Deutschlandstipendium is much less competitive than DAAD", "Admissions",
     "scholarship,funding,deutschlandstipendium",
     "€300 a month, applied through your university rather than nationally.\n\n"
     "Because it is per-university the applicant pool is far smaller than DAAD. My department had 40 "
     "applicants for 9 places. DAAD is thousands for dozens.\n\n"
     "Almost nobody I know applied. Check your university's page, deadlines are usually early autumn.",
     "meera_j", 7, 32),

    ("Recognition of my degree took longer than the visa", "Admissions",
     "anabin,recognition,documents",
     "My university was listed H+ in anabin, which I assumed meant done. It did not.\n\n"
     "The individual degree still had to be assessed, and because my institution changed names in 2019 "
     "the records did not line up. That took seven weeks to resolve with a letter from my registrar.\n\n"
     "Check both the institution AND the specific qualification, and start early if your university has "
     "been renamed or merged.", "duc_h", 5, 21),

    ("Moved from Berlin to Aachen after one semester — no regrets", "Housing",
     "city,transfer,student-life",
     "Berlin was overwhelming and I found a room only in month three.\n\n"
     "Aachen is a fraction of the size, my rent dropped by 200, and the department is much closer knit. "
     "I was worried it would be boring. It is quieter, not boring.\n\n"
     "If you are choosing purely on the city's reputation, visit first if you possibly can.", "rania_s", 4, 25),

    ("First month checklist that I wish someone had given me", "Student Life",
     "checklist,arrival,admin",
     "In this order, because several depend on the previous one.\n\n"
     "1. Anmeldung, needs the landlord confirmation.\n"
     "2. Bank account, most want the Anmeldung.\n"
     "3. Health insurance confirmation to the university.\n"
     "4. Enrolment, needs 2 and 3.\n"
     "5. Broadcasting fee registration, it finds you anyway.\n\n"
     "Doing these out of order is why people spend six weeks in circles.", "farah_s", 2, 36),
]

# post_index, author, body, days_after_post, upvotes, reply_to (index in that post's list, or None)
COMMENTS = [
    (0, "arif_r", "The grading key got me too. It is on the back of the page and you never think of it as part of the document.", 1, 14, None),
    (0, "priya_r", "Adding one: if your transcripts are issued in English, uni-assist can still ask for the original language version. Send both.", 2, 22, None),
    (0, "ayesha_k", "Good point, I sent both the second time and it stopped being an issue.", 3, 6, 1),
    (0, "bagus_s", "Nine days is fast. Mine took five weeks in peak season.", 4, 9, None),
    (0, "nikhil_r", "Does this apply to the VPD as well or only the full application?", 6, 3, None),
    (0, "ayesha_k", "Same documents for the VPD in my case.", 7, 5, 4),

    (1, "nadia_i", "Almost identical from Islamabad, about a week longer at the interview stage.", 2, 18, None),
    (1, "fatima_z", "They are verifying you actually did your degree, nothing more.", 4, 11, None),
    (1, "arif_r", "Worth noting this differs for Bangladesh and India — different office, different process.", 6, 26, None),

    (2, "mai_nguyen", "Second the point about opening it before the appointment. I brought a confirmation email instead of the actual blocked confirmation and had to rebook.", 2, 31, None),
    (2, "deniz_y", "Rebooking cost me six weeks. Please do not do what we did.", 3, 19, 0),
    (2, "kwame_m", "Does the bundled insurance get accepted or do they want a separate public insurance letter?", 5, 7, None),
    (2, "youssef_h", "Accepted at the visa stage. Your university may still want public insurance once you enrol.", 6, 12, 2),
    (2, "layla_m", "Third option nobody mentions: some home banks will not transfer to a blocked account at all. Check first.", 8, 16, None),

    (3, "fatima_z", "Naming a research group is underrated. It is the difference between a letter about you and a letter about Germany.", 1, 24, None),
    (3, "bagus_s", "7 applications feels like a lot until you see the reply rate.", 2, 8, None),
    (3, "rahul_m", "Nobody posts about the rejections so the base rate looks much better than it is.", 3, 15, 1),
    (3, "tobi_ade", "What was your work experience in? Wondering whether unrelated experience counts.", 4, 5, None),
    (3, "rahul_m", "Directly related, powertrain testing. Unrelated helps much less, honestly.", 5, 9, 3),

    (4, "deniz_y", "The 20-minute rule is real. The flats I replied to within the hour were the only ones that answered.", 1, 33, None),
    (4, "ayesha_k", "Hostel for two weeks was what I did too. Signing unseen from abroad is how the scams get people.", 2, 21, None),
    (4, "nadia_i", "Anyone tried the Wohnheim route? Waiting lists look long but rent is a third.", 3, 10, None),
    (4, "mai_nguyen", "Applied to three, got an offer after 11 months. Do it on day one as a backup, useless as a plan A.", 4, 17, 2),
    (4, "kwame_m", "Munich specifically or is Frankfurt as bad?", 6, 4, None),
    (4, "mai_nguyen", "Munich is the worst in the country by a distance. Frankfurt is expensive but findable.", 7, 13, 4),
    (4, "chidi_n", "The PDF with documents attached is the single highest-leverage thing here.", 9, 28, None),

    (5, "arif_r", "Outer district tip worked in Berlin. Spandau in four days while Mitte showed nothing until November.", 2, 20, None),
    (5, "tobi_ade", "My landlord took three weeks to send the Wohnungsgeberbestätigung. Ask the day you sign.", 3, 12, None),
    (5, "deniz_y", "That is the real bottleneck, not the appointment.", 4, 6, 1),

    (6, "bagus_s", "German improving through standups is so true. Six months of small talk beat two semesters of a course.", 2, 15, None),
    (6, "nadia_i", "Check the 120-day rule carefully. A friend went over and it caused problems at visa extension.", 3, 23, None),
    (6, "kwame_m", "Verbal assurances from a manager mean nothing to the Ausländerbehörde.", 4, 9, 1),

    (7, "youssef_h", "A2 for daily life, B1 for bureaucracy is the most accurate summary I have read.", 1, 27, None),
    (7, "priya_r", "Even in an English-speaking research group, lunch is in German. You feel it socially first.", 2, 19, None),
    (7, "tobi_ade", "Started at A1 after arriving and regret it.", 3, 7, None),
    (7, "hina_s", "Volkshochschule courses are far cheaper than the private schools and just as good.", 5, 30, None),

    (8, "arif_r", "Dhaka: booked May, appointment October, decision 7 weeks after.", 1, 13, None),
    (8, "bagus_s", "Jakarta: about 10 weeks to an appointment, decision in 4.", 2, 8, None),
    (8, "ayesha_k", "Karachi was the worst part of my whole process.", 3, 11, None),
    (8, "emeka_o", "Lagos: 14 weeks. Book before you even have the offer if your embassy allows it.", 4, 18, None),
    (8, "quang_p", "Hanoi: 6 weeks, which surprised me. It really does vary enormously.", 6, 9, None),

    (9, "tobi_ade", "The most useful thing I have read about German PhDs. The portal route barely exists in some fields.", 1, 29, None),
    (9, "nadia_i", "Two-page proposal is the key detail. I sent a CV and a paragraph and got nothing for months.", 2, 16, None),
    (9, "priya_r", "The proposal makes replying easy for them. Give them something concrete to react to.", 3, 10, 1),

    (10, "ravi_k", "anabin is genuinely hard to read the first time. Worth asking someone who has done it.", 2, 12, None),
    (10, "bilal_a", "Agreed, the interface is from another era but it is the authoritative source.", 3, 5, 0),

    (11, "sara_h", "Turning 30 mid-degree caught me completely off guard. Budget for it if you are 29.", 2, 21, None),
    (11, "vikram_n", "Exactly why I posted. It is not mentioned anywhere in the enrolment material.", 3, 8, 0),
    (11, "amina_d", "Switching back from private to public was refused for me. Take this seriously.", 5, 25, None),

    (12, "zainab_a", "Reapplying after fixing the ECTS gap is the part I want people to see. Rejection is often a checklist problem.", 2, 17, None),
    (12, "anjali_d", "Did the online modules count officially or did you argue for them?", 4, 6, None),
    (12, "zainab_a", "Officially, they were ECTS-bearing from an accredited university. That mattered.", 5, 11, 1),

    (13, "thanh_le", "Mine covers the whole of NRW and I did not realise for a full semester.", 2, 14, None),
    (13, "linh_t", "Read the fine print, some states include long-distance regional trains.", 3, 7, 0),

    (14, "karim_b", "Eleven days is not unusual. Intermediary banks are invisible until they hold your money.", 2, 19, None),
    (14, "omar_f", "Nobody tells you the correspondent bank even exists.", 3, 6, 0),
    (14, "sadia_h", "Three weeks buffer is the right advice. I would say four in December.", 5, 13, None),

    (15, "grace_w", "Hochschulsport is genuinely the best social advice on this forum.", 2, 26, None),
    (15, "sneha_p", "It removed the pressure of having to make conversation. You just turn up.", 3, 14, 0),
    (15, "dewi_l", "The work and social separation took me a year to stop reading as rejection.", 4, 31, None),
    (15, "mehmet_k", "Second semester was completely different for me. It does get better.", 6, 20, None),

    (16, "rina_p", "This matches Dresden almost exactly. The east is much more affordable than people expect.", 2, 15, None),
    (16, "grace_w", "The semester contribution twice a year is the one that surprises people mid-year.", 3, 9, None),
    (16, "ishaan_v", "Munich here. 740 for a room in a shared flat. The gap is enormous.", 4, 22, None),

    (17, "tunde_b", "Applying to German-speaking roles instead of only English ones doubled my callbacks.", 2, 18, None),
    (17, "hasan_c", "Willingness counts for more than fluency in a lot of teams.", 3, 8, 0),

    (18, "meera_j", "Referencing a specific paper and disagreeing with it is the whole trick.", 2, 23, None),
    (18, "aditya_s", "One paragraph. Long emails get skimmed and forgotten.", 3, 11, 0),
    (18, "putri_h", "Semester break timing also matters a lot. October is hopeless.", 5, 16, None),

    (19, "noor_f", "The A1 requirement for the spouse catches people completely by surprise.", 2, 20, None),
    (19, "imran_m", "And it takes months to prepare for if they are starting from nothing.", 3, 9, 0),
    (19, "kofi_a", "Starting both processes in parallel is the correct advice. We lost three months.", 5, 14, None),

    (20, "ebube_c", "40 applicants for 9 places versus DAAD's thousands. That ratio deserves more attention.", 1, 24, None),
    (20, "meera_j", "And it stacks with other funding in most universities.", 2, 12, 0),
    (20, "farah_s", "Deadlines are university-specific which is exactly why nobody hears about them.", 4, 17, None),

    (21, "duc_h", "The renamed institution problem is more common than you would think.", 2, 10, None),
    (21, "nikhil_r", "Mine merged in 2020 and I needed a letter too. Ask the registrar early.", 3, 13, 0),

    (22, "rania_s", "Happy to answer anything about the transfer process, it was less painful than expected.", 2, 8, None),
    (22, "mehmet_k", "Smaller cities are underrated. The department knowing your name changes the experience.", 3, 15, None),

    (23, "farah_s", "The ordering is the part people get wrong. Each one blocks the next.", 1, 21, None),
    (23, "sadia_h", "Broadcasting fee finding you anyway made me laugh. It absolutely does.", 2, 27, None),
    (23, "amina_d", "Add: bring passport photos. You will need more than you think.", 3, 19, None),
    (23, "kofi_a", "Saving this. Wish it existed when I arrived.", 4, 12, None),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db-url")
    ap.add_argument("--clear", action="store_true")
    args = ap.parse_args()

    if args.db_url:
        os.environ["DATABASE_URL"] = args.db_url

    from sqlalchemy import text
    from app.database import SessionLocal
    from app.models.user import User, UserRole
    from app.models.community import Post, Comment, Vote
    from app.auth import get_password_hash

    rng = random.Random(20260827)
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    try:
        pat = f"%@{DEMO_DOMAIN}"
        n_existing = db.execute(
            text("SELECT COUNT(*) FROM users WHERE email LIKE :pat"), {"pat": pat}
        ).scalar()

        if args.clear:
            if not n_existing:
                print("[CLEAR] No demo users found.")
                return 0

            # Delete through raw SQL, not the ORM. The relationships use
            # backref="posts" with no delete cascade, so session.delete(user)
            # tries to UPDATE posts SET author_id=NULL first — and that column
            # is NOT NULL. Every FK to users.id already carries
            # ON DELETE CASCADE, so letting Postgres do the work is both
            # correct and a single statement.
            n_posts = db.execute(
                text("SELECT COUNT(*) FROM posts p JOIN users u ON p.author_id = u.id "
                     "WHERE u.email LIKE :pat"), {"pat": pat}
            ).scalar()
            n_comments = db.execute(
                text("SELECT COUNT(*) FROM comments c JOIN users u ON c.author_id = u.id "
                     "WHERE u.email LIKE :pat"), {"pat": pat}
            ).scalar()

            db.execute(text("DELETE FROM users WHERE email LIKE :pat"), {"pat": pat})
            db.commit()
            print(f"[CLEAR] Removed {n_existing} demo users, {n_posts} posts and "
                  f"{n_comments} comments (votes and saves cascaded).")
            return 0

        if n_existing:
            print(f"[SKIP] {n_existing} demo users already exist. Run with --clear first to reseed.")
            return 0

        users = {}
        for full_name, username in PEOPLE:
            u = User(
                email=f"{username}@{DEMO_DOMAIN}",
                username=username,
                hashed_password=get_password_hash(DEMO_PASSWORD),
                full_name=full_name,
                role=UserRole.USER,
                is_active=True,
                is_verified=True,
                created_at=now - timedelta(days=rng.randint(60, 500)),
            )
            db.add(u)
            users[username] = u
        db.flush()
        pool = list(users.values())
        print(f"[USERS] {len(pool)} demo accounts")

        posts = []
        for title, category, tags, body, author, days_ago, ups in POSTS:
            p = Post(
                title=title, content=body, author_id=users[author].id,
                category=category, tags=tags,
                created_at=now - timedelta(days=days_ago, hours=rng.randint(0, 20)),
            )
            db.add(p)
            posts.append((p, ups, days_ago))
        db.flush()
        cats = sorted({c for _, c, *_ in [(p[0], p[0].category) for p in posts]})
        print(f"[POSTS] {len(posts)} posts across {len(cats)} categories")

        per_post: dict[int, list] = {}
        comment_votes = 0
        for post_i, author, body, days_after, ups, reply_to in COMMENTS:
            post, _, post_days = posts[post_i]
            parent_id = None
            if reply_to is not None:
                sib = per_post.get(post_i, [])
                if reply_to < len(sib):
                    parent_id = sib[reply_to].id

            c = Comment(
                content=body, post_id=post.id, author_id=users[author].id, parent_id=parent_id,
                created_at=now - timedelta(days=max(post_days - days_after, 0), hours=rng.randint(0, 20)),
            )
            db.add(c)
            db.flush()
            per_post.setdefault(post_i, []).append(c)

            for voter in rng.sample(pool, min(ups, len(pool))):
                db.add(Vote(value=1, user_id=voter.id, comment_id=c.id))
                comment_votes += 1

        counts = [len(v) for v in per_post.values()]
        replies = sum(1 for c in COMMENTS if c[5] is not None)
        print(f"[COMMENTS] {len(COMMENTS)} comments ({replies} threaded replies), "
              f"{min(counts)}–{max(counts)} per post")

        post_votes = 0
        for post, ups, _ in posts:
            for voter in rng.sample(pool, min(ups, len(pool))):
                db.add(Vote(value=1, user_id=voter.id, post_id=post.id))
                post_votes += 1

        db.commit()
        ups_all = [p[1] for p in posts]
        print(f"[VOTES] {post_votes} post votes (range {min(ups_all)}–{max(ups_all)}), "
              f"{comment_votes} comment votes")
        print()
        print("=" * 62)
        print("  COMMUNITY SEEDED")
        print(f"  Demo accounts sign in with: {DEMO_PASSWORD}")
        print(f"  All demo emails end in @{DEMO_DOMAIN}")
        print("  Remove: python -m scripts.seed_community --clear --db-url ...")
        print("=" * 62)
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
