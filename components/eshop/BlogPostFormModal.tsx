'use client';

import { useState, useCallback } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useEshopBlogStore } from '@/stores/eshop-blog-store';
import { useAuthStore } from '@/core/stores/auth-store';
import { BlogRichTextEditor } from './BlogRichTextEditor';
import { BlogTagInput } from './BlogTagInput';
import { BlogImageUpload } from './BlogImageUpload';
import { AiPreviewModal } from './AiPreviewModal';
import { generateSlug } from '@/features/eshop/eshop-produkty-helpers';
import type { BlogPostStatus } from '@/shared/types';

interface BlogPostFormModalProps {
  postId: number | null;
  onClose: () => void;
}

type FormStatus = 'koncept' | 'planovany' | 'publikovano';

export function BlogPostFormModal({ postId, onClose }: BlogPostFormModalProps) {
  const {
    getPostById, createPost, updatePost, selectedShopId, getAllTags, uploadImage,
    generateBlogAiText, aiGenerating, isAiBlogPreviewOpen, aiBlogPreviewData,
    aiBlogPreviewPostId, aiBlogPreviewUsage, openAiBlogPreview, closeAiBlogPreview,
  } = useEshopBlogStore();
  const { currentUser } = useAuthStore();

  const existingPost = postId ? getPostById(postId) : null;
  const isEditing = !!existingPost;

  const [title, setTitle] = useState(existingPost?.title ?? '');
  const [slug, setSlug] = useState(existingPost?.slug ?? '');
  const [shortDescription, setShortDescription] = useState(existingPost?.shortDescription ?? '');
  const [content, setContent] = useState(existingPost?.content ?? '');
  const [imageUrl, setImageUrl] = useState(existingPost?.imageUrl ?? '');
  const [seoTitle, setSeoTitle] = useState(existingPost?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(existingPost?.seoDescription ?? '');
  const [tags, setTags] = useState<string[]>(existingPost?.tags ?? []);
  const [status, setStatus] = useState<FormStatus>(existingPost?.status ?? 'koncept');
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (existingPost?.status === 'planovany' && existingPost.publishedAt) {
      return existingPost.publishedAt.slice(0, 16);
    }
    return '';
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const allTags = getAllTags();

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slugManuallyEdited) {
      setSlug(newTitle ? generateSlug(newTitle) : '');
    }
  };

  const handleImageUpload = useCallback(
    async (file: File) => {
      const result = await uploadImage(file, postId ?? undefined);
      if (result.success && result.url) {
        setImageUrl(result.url);
      }
      return result;
    },
    [uploadImage, postId],
  );

  const handleInlineImageUpload = useCallback(
    async (file: File) => {
      return uploadImage(file, postId ?? undefined);
    },
    [uploadImage, postId],
  );

  const handleGenerateBlogAi = async () => {
    if (!postId) return;
    const result = await generateBlogAiText(postId);
    if (result.success && result.data) {
      openAiBlogPreview(postId, result.data, result.usage);
    }
  };

  const handleApplyBlogAiTexts = (selectedFields: Record<string, string>) => {
    if (selectedFields.shortDescription !== undefined) setShortDescription(selectedFields.shortDescription);
    if (selectedFields.content !== undefined) setContent(selectedFields.content);
    if (selectedFields.seoTitle !== undefined) setSeoTitle(selectedFields.seoTitle);
    if (selectedFields.seoDescription !== undefined) setSeoDescription(selectedFields.seoDescription);
    closeAiBlogPreview();
  };

  const handleSave = async (saveStatus?: FormStatus) => {
    const finalStatus = saveStatus ?? status;

    if (!title.trim()) {
      return;
    }
    if (!selectedShopId) {
      return;
    }

    setSaving(true);

    const data = {
      shopId: selectedShopId,
      title: title.trim(),
      slug: slug || generateSlug(title),
      shortDescription: shortDescription.trim() || undefined,
      content: content || undefined,
      imageUrl: imageUrl || undefined,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      tags,
      status: finalStatus as BlogPostStatus,
      authorId: currentUser?.id ? Number(currentUser.id) : undefined,
      publishedAt:
        finalStatus === 'publikovano'
          ? existingPost?.publishedAt ?? new Date().toISOString()
          : finalStatus === 'planovany' && scheduledDate
            ? new Date(scheduledDate).toISOString()
            : existingPost?.publishedAt,
    };

    if (isEditing && postId) {
      await updatePost(postId, data);
    } else {
      await createPost(data);
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? 'Upravit článek' : 'Nový článek'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex gap-6">
            {/* Left column - Content */}
            <div className="flex-1 space-y-4 min-w-0">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Název článku *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Zadejte název článku"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300 transition-colors"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  URL slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                  placeholder="url-slug-clanku"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-600 outline-none focus:border-orange-300 transition-colors font-mono"
                />
              </div>

              {/* Short description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Krátký popis
                </label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Krátký popis pro výpis článků"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none resize-none focus:border-orange-300 transition-colors"
                />
              </div>

              {/* Content editor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Obsah
                </label>
                <BlogRichTextEditor
                  content={content}
                  onChange={setContent}
                  onImageUpload={handleInlineImageUpload}
                />
              </div>
            </div>

            {/* Right column - Sidebar */}
            <div className="w-72 flex-shrink-0 space-y-4">
              {/* Featured image */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Náhledový obrázek
                </label>
                <BlogImageUpload
                  imageUrl={imageUrl}
                  onUpload={handleImageUpload}
                  onRemove={() => setImageUrl('')}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Stav
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FormStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none cursor-pointer focus:border-orange-300 transition-colors"
                >
                  <option value="koncept">Koncept</option>
                  <option value="planovany">Naplánovat</option>
                  <option value="publikovano">Publikovat</option>
                </select>
              </div>

              {/* Scheduled date */}
              {status === 'planovany' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    Datum publikování
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-orange-300 transition-colors"
                  />
                </div>
              )}

              {/* AI Generation */}
              {isEditing && (
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    AI Generování
                  </label>
                  <button
                    onClick={handleGenerateBlogAi}
                    disabled={aiGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
                  >
                    <Sparkles className="w-4 h-4" />
                    {aiGenerating ? 'Generuji...' : 'AI Přetextovat'}
                  </button>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Vygeneruje krátký popis, obsah a SEO metadata
                  </p>
                </div>
              )}

              {/* SEO Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || 'Meta title pro vyhledávače'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-orange-300 transition-colors"
                />
                <p className="text-xs text-slate-400 mt-1">{seoTitle.length}/60 znaků</p>
              </div>

              {/* SEO Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  SEO Description
                </label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta popis pro vyhledávače"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none resize-none focus:border-orange-300 transition-colors"
                />
                <p className="text-xs text-slate-400 mt-1">{seoDescription.length}/160 znaků</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Tagy
                </label>
                <BlogTagInput tags={tags} onChange={setTags} suggestions={allTags} />
              </div>

              {/* Author */}
              {currentUser && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    Autor
                  </label>
                  <p className="text-sm font-medium text-slate-600">{currentUser.fullName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Zrušit
          </button>
          {status !== 'publikovano' && (
            <button
              onClick={() => handleSave('koncept')}
              disabled={saving || !title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Uložit jako koncept
            </button>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving || !title.trim() || (status === 'planovany' && !scheduledDate)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {saving
              ? 'Ukládám...'
              : status === 'publikovano'
                ? 'Publikovat'
                : status === 'planovany'
                  ? 'Naplánovat'
                  : 'Uložit'}
          </button>
        </div>
      </div>

      {/* AI Preview Modal */}
      {isAiBlogPreviewOpen && aiBlogPreviewPostId === postId && aiBlogPreviewData && (
        <AiPreviewModal
          title={title || 'Blog článek'}
          fields={[
            { key: 'shortDescription', label: 'Krátký popis', original: shortDescription, generated: aiBlogPreviewData.shortDescription },
            { key: 'content', label: 'Obsah', original: content, generated: aiBlogPreviewData.content, multiline: true },
            { key: 'seoTitle', label: 'SEO Title', original: seoTitle, generated: aiBlogPreviewData.seoTitle },
            { key: 'seoDescription', label: 'SEO Description', original: seoDescription, generated: aiBlogPreviewData.seoDescription },
          ]}
          usage={aiBlogPreviewUsage ?? undefined}
          onApply={handleApplyBlogAiTexts}
          onReject={closeAiBlogPreview}
        />
      )}
    </div>
  );
}
