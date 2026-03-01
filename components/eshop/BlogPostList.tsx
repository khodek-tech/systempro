'use client';

import Image from 'next/image';
import { Search, Plus, Eye, Pencil, Trash2, Send, Clock, FileText, RotateCcw } from 'lucide-react';
import { useEshopBlogStore } from '@/stores/eshop-blog-store';
import { BlogPostFormModal } from './BlogPostFormModal';
import { BlogPostPreviewModal } from './BlogPostPreviewModal';
import type { BlogPostStatus, AiStatus } from '@/shared/types';

const STATUS_TABS: { id: 'all' | BlogPostStatus; label: string }[] = [
  { id: 'all', label: 'Vše' },
  { id: 'koncept', label: 'Koncepty' },
  { id: 'planovany', label: 'Plánované' },
  { id: 'publikovano', label: 'Publikované' },
];

const AI_STATUS_LABELS: Record<AiStatus, { label: string; className: string }> = {
  ceka: { label: 'Čeká', className: 'bg-orange-50 text-orange-600' },
  generuje: { label: 'Generuje', className: 'bg-blue-50 text-blue-600' },
  vygenerovano: { label: 'Hotovo', className: 'bg-green-50 text-green-600' },
  schvaleno: { label: 'Schváleno', className: 'bg-emerald-50 text-emerald-700' },
};

function StatusBadge({ status }: { status: BlogPostStatus }) {
  const config = {
    koncept: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Koncept' },
    planovany: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Plánováno' },
    publikovano: { bg: 'bg-green-100', text: 'text-green-600', label: 'Publikováno' },
  }[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export function BlogPostList() {
  const {
    searchQuery,
    statusFilter,
    isFormOpen,
    editingPostId,
    isPreviewOpen,
    previewPostId,
    setSearchQuery,
    setStatusFilter,
    openForm,
    closeForm,
    openPreview,
    closePreview,
    getFilteredPosts,
    deletePost,
    publishPost,
    unpublishPost,
  } = useEshopBlogStore();

  const posts = getFilteredPosts();

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat články..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-orange-300 transition-colors"
          />
        </div>

        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nový článek
        </button>
      </div>

      {/* List */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-lg font-semibold text-slate-600 mb-1">Žádné články</p>
          <p className="text-sm text-slate-400">
            {searchQuery || statusFilter !== 'all'
              ? 'Zkuste změnit filtry'
              : 'Vytvořte svůj první blog článek'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Článek
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-28">
                  Stav
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-24">
                  AI
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-36">
                  Datum
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-44">
                  Tagy
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-36">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {post.imageUrl ? (
                        <Image
                          src={post.imageUrl}
                          alt=""
                          width={48}
                          height={48}
                          unoptimized
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{post.title}</p>
                        {post.shortDescription && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{post.shortDescription}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {post.aiStatus && AI_STATUS_LABELS[post.aiStatus] && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${AI_STATUS_LABELS[post.aiStatus].className}`}>
                        {AI_STATUS_LABELS[post.aiStatus].label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })
                        : new Date(post.createdAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-xs text-slate-400">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openPreview(post.id)}
                        title="Náhled"
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openForm(post.id)}
                        title="Upravit"
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {post.status === 'koncept' && (
                        <button
                          onClick={() => publishPost(post.id)}
                          title="Publikovat"
                          className="p-1.5 rounded-md text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {post.status === 'publikovano' && (
                        <button
                          onClick={() => unpublishPost(post.id)}
                          title="Vrátit do konceptu"
                          className="p-1.5 rounded-md text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {post.status === 'planovany' && (
                        <button
                          onClick={() => void 0}
                          title="Plánováno"
                          className="p-1.5 rounded-md text-blue-400 cursor-default"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('Opravdu smazat tento článek?')) {
                            deletePost(post.id);
                          }
                        }}
                        title="Smazat"
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {isFormOpen && <BlogPostFormModal postId={editingPostId} onClose={closeForm} />}

      {/* Preview modal */}
      {isPreviewOpen && previewPostId && <BlogPostPreviewModal postId={previewPostId} onClose={closePreview} />}
    </>
  );
}
