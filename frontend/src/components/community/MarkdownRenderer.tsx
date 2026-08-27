import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

interface MarkdownRendererProps {
    children: string;
    className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className }) => {
    // Basic hashtag processor
    // This replaces #tag with a markdown link [#tag](/community?tag=tag)
    // Note: This is a simple regex and might match hashtags inside code blocks.
    // robust parsing would require a remark plugin.
    const processContent = (text: string) => {
        return text.replace(/(?<=^|\s)#(\w+)/g, '[$&](/community?tag=$1)');
    };

    // Custom link renderer to handle internal links with React Router
    const components = {
        a: ({ href, children, ...props }: any) => {
            const isInternal = href && href.startsWith('/');
            if (isInternal) {
                return (
                    <Link to={href} className="text-blue-600 hover:underline" {...props}>
                        {children}
                    </Link>
                );
            }
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    {...props}
                >
                    {children}
                </a>
            );
        }
    };

    return (
        <div className={`prose dark:prose-invert max-w-none ${className || ''}`}>
            <ReactMarkdown components={components}>
                {processContent(children)}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
