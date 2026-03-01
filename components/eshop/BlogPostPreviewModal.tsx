'use client';

import Image from 'next/image';
import { X, Calendar, Tag } from 'lucide-react';
import { useEshopBlogStore } from '@/stores/eshop-blog-store';
import DOMPurify from 'dompurify';

interface BlogPostPreviewModalProps {
  postId: number;
  onClose: () => void;
}

export function BlogPostPreviewModal({ postId, onClose }: BlogPostPreviewModalProps) {
  const { getPostById } = useEshopBlogStore();
  const post = getPostById(postId);

  if (!post) return null;

  const sanitizedContent = DOMPurify.sanitize(post.content ?? '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Náhled článku</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Featured image */}
          {post.imageUrl && (
            <Image
              src={post.imageUrl}
              alt={post.title}
              width={800}
              height={450}
              unoptimized
              className="w-full aspect-video object-cover rounded-2xl mb-6"
            />
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 mb-4">
            {post.publishedAt && (
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
            {post.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-slate-400" />
                {post.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">{post.title}</h1>

          {/* Short description */}
          {post.shortDescription && (
            <p className="text-lg text-slate-500 mb-6 leading-relaxed">{post.shortDescription}</p>
          )}

          {/* Content */}
          {sanitizedContent && (
            <div
              className="prose prose-slate prose-headings:font-bold prose-a:text-blue-600 max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
