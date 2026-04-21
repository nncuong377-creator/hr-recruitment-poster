"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ContentForm } from "./_components/content-form";
import { ContentPreview } from "./_components/content-preview";
import type { MediaItem } from "./_components/media-uploader";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormValues {
  jobTitle: string;
  category: string;
  requirements: string;
  benefits: string;
  tone: "professional" | "friendly" | "energetic";
  contactInfo: string;
}

interface GenerateOutput {
  body: string;
  hashtags: string[];
  suggestedTitle: string;
  missingFields: string[];
  warnings: string[];
}

const DRAFT_KEY = "hr-poster-draft";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const { register, control, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { tone: "professional", category: "", jobTitle: "", requirements: "", benefits: "", contactInfo: "" },
  });

  // Preview state
  const [generated, setGenerated] = useState<GenerateOutput | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editHashtags, setEditHashtags] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Media
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);

  // UI
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [draftBannerVisible, setDraftBannerVisible] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const watchedValues = watch();
  const canGenerate = !!(watchedValues.jobTitle?.trim() && watchedValues.category);

  // ─── Draft restore on mount ────────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.formValues) reset({ ...draft.formValues, tone: draft.formValues.tone ?? "professional" });
      if (draft.editTitle) setEditTitle(draft.editTitle);
      if (draft.editBody) setEditBody(draft.editBody);
      if (draft.editHashtags) setEditHashtags(draft.editHashtags);
      if (draft.showPreview) setShowPreview(draft.showPreview);
      if (draft.warnings) setWarnings(draft.warnings);
      if (draft.missingFields) setMissingFields(draft.missingFields);
      setDraftBannerVisible(true);
    } catch {
      // ignore corrupt draft
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-save draft ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!showPreview && !editTitle && !editBody) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          formValues: watchedValues,
          editTitle,
          editBody,
          editHashtags,
          showPreview,
          warnings,
          missingFields,
        }));
      } catch { /* ignore */ }
    }, 1000);
    setHasUnsaved(true);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.jobTitle, watchedValues.category, watchedValues.requirements,
      watchedValues.benefits, watchedValues.tone, watchedValues.contactInfo,
      editTitle, editBody, editHashtags]);

  // ─── Unsaved changes warning ───────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function callGenerate(values: FormValues) {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: values.jobTitle,
          category: values.category,
          requirements: values.requirements || undefined,
          benefits: values.benefits || undefined,
          tone: values.tone,
          contactInfo: values.contactInfo || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Tạo nội dung thất bại");

      const output: GenerateOutput = json.data;
      setGenerated(output);
      setEditTitle(output.suggestedTitle);
      setEditBody(output.body);
      setEditHashtags(output.hashtags);
      setWarnings(output.warnings ?? []);
      setMissingFields(output.missingFields ?? []);
      setShowPreview(true);
      toast.success("Đã tạo nội dung bằng AI");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      toast.error(`Không tạo được nội dung: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleGenerateClick() {
    callGenerate(watchedValues);
  }

  function handleSelfWrite() {
    setEditTitle("");
    setEditBody("");
    setEditHashtags([]);
    setWarnings([]);
    setMissingFields([]);
    setShowPreview(true);
  }

  async function handleSave(status: "DRAFT" | "APPROVED") {
    if (!editTitle || !editBody) {
      toast.error("Tiêu đề và nội dung bài đăng là bắt buộc");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("position", watchedValues.jobTitle ?? "");
      formData.append("description", editBody);
      formData.append("requirements", watchedValues.requirements ?? "");
      formData.append("benefits", watchedValues.benefits ?? "");
      formData.append("applyInfo", watchedValues.contactInfo ?? "");
      formData.append("hashtags", JSON.stringify(editHashtags));
      formData.append("status", status);

      for (const item of mediaFiles) {
        formData.append("media", item.file);
      }

      const res = await fetch("/api/content", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lưu thất bại");

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);
      setHasUnsaved(false);
      setDraftBannerVisible(false);

      toast.success(
        status === "APPROVED" ? "Đã lưu & duyệt bài đăng" : "Đã lưu nháp",
        { description: `Tiêu đề: ${editTitle}` }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      toast.error(`Lưu thất bại: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  }

  function handleRegenerate() {
    callGenerate(watchedValues);
  }

  function restoreDraft() {
    setDraftBannerVisible(false);
    toast.info("Đã khôi phục bản nháp");
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setDraftBannerVisible(false);
    reset({ tone: "professional" });
    setEditTitle("");
    setEditBody("");
    setEditHashtags([]);
    setShowPreview(false);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tạo bài đăng</h2>
        <p className="text-sm text-muted-foreground">
          AI sẽ tự động soạn nội dung tuyển dụng chuẩn format Facebook
        </p>
      </div>

      {/* Draft restore banner */}
      {draftBannerVisible && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
          <p className="text-blue-800">📝 Có bản nháp chưa hoàn thành, bạn có muốn khôi phục?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="font-medium text-blue-700 hover:underline"
            >
              Khôi phục
            </button>
            <span className="text-blue-400">·</span>
            <button
              type="button"
              onClick={discardDraft}
              className="text-blue-600 hover:underline"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* Main layout: form left + preview right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
        <ContentForm
          register={register}
          control={control}
          errors={errors}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
          onGenerate={handleGenerateClick}
          onSelfWrite={handleSelfWrite}
        />

        {showPreview && (
          <ContentPreview
            title={editTitle}
            setTitle={(v) => { setEditTitle(v); setHasUnsaved(true); }}
            body={editBody}
            setBody={(v) => { setEditBody(v); setHasUnsaved(true); }}
            hashtags={editHashtags}
            setHashtags={(v) => { setEditHashtags(v); setHasUnsaved(true); }}
            warnings={warnings}
            missingFields={missingFields}
            mediaFiles={mediaFiles}
            setMediaFiles={setMediaFiles}
            isGenerating={isGenerating}
            isSaving={isSaving}
            onRegenerate={handleRegenerate}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
