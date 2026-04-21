"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentCard, type ContentItem } from "./content-card";
import { ContentFilterBar } from "./content-filter-bar";
import { ContentDetailDialog } from "./content-detail-dialog";
import { Pagination } from "./pagination";

export function ContentPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearchState] = useState(searchParams.get("search") ?? "");
  const [status, setStatusState] = useState(searchParams.get("status") ?? "");
  const [sort, setSortState] = useState(searchParams.get("sort") ?? "newest");
  const [page, setPageState] = useState(parseInt(searchParams.get("page") ?? "1", 10));

  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateUrl(params: Record<string, string>) {
    const merged: Record<string, string> = { search, status, sort, page: String(page), ...params };
    const sp = new URLSearchParams();
    if (merged.search) sp.set("search", merged.search);
    if (merged.status) sp.set("status", merged.status);
    if (merged.sort && merged.sort !== "newest") sp.set("sort", merged.sort);
    if (merged.page && merged.page !== "1") sp.set("page", merged.page);
    router.replace(`/dashboard/content${sp.toString() ? "?" + sp.toString() : ""}`, { scroll: false });
  }

  const fetchContent = useCallback(async (
    q: { search: string; status: string; sort: string; page: number }
  ) => {
    setIsLoading(true);
    try {
      const sp = new URLSearchParams({ sort: q.sort, page: String(q.page), limit: "12" });
      if (q.search) sp.set("search", q.search);
      if (q.status) sp.set("status", q.status);
      const res = await fetch(`/api/content?${sp.toString()}`);
      const json = await res.json();
      setItems(json.items ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent({ search, status, sort, page });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sort, page]);

  function handleSearchChange(v: string) {
    setSearchState(v);
    setPageState(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      updateUrl({ search: v, page: "1" });
      fetchContent({ search: v, status, sort, page: 1 });
    }, 300);
  }

  function handleStatusChange(v: string) {
    setStatusState(v);
    setPageState(1);
    updateUrl({ status: v, page: "1" });
  }

  function handleSortChange(v: string) {
    setSortState(v);
    setPageState(1);
    updateUrl({ sort: v, page: "1" });
  }

  function handlePageChange(p: number) {
    setPageState(p);
    updateUrl({ page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleClearFilters() {
    setSearchState(""); setStatusState(""); setSortState("newest"); setPageState(1);
    router.replace("/dashboard/content", { scroll: false });
    fetchContent({ search: "", status: "", sort: "newest", page: 1 });
  }

  const hasActiveFilters = !!(search || status || sort !== "newest");
  const refetch = () => fetchContent({ search, status, sort, page });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Thư viện content</h2>
          <p className="text-sm text-muted-foreground">
            {total > 0 ? `${total} bài đăng` : "Quản lý tất cả bài đăng tuyển dụng"}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/create"><Plus className="size-4" />Tạo mới</Link>
        </Button>
      </div>

      <ContentFilterBar
        search={search} status={status} sort={sort}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <p className="text-5xl mb-4">📭</p>
          <h3 className="text-lg font-semibold">
            {hasActiveFilters ? "Không tìm thấy kết quả" : "Chưa có content nào"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {hasActiveFilters ? "Thử thay đổi bộ lọc hoặc xoá filter" : "Tạo bài đăng đầu tiên để bắt đầu"}
          </p>
          {hasActiveFilters
            ? <Button variant="outline" onClick={handleClearFilters}>Xoá filter</Button>
            : <Button asChild><Link href="/dashboard/create">+ Tạo bài đầu tiên</Link></Button>
          }
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ContentCard key={item.id} item={item} onSelect={() => setSelectedId(item.id)} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}

      <ContentDetailDialog
        contentId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdated={refetch}
        onDeleted={refetch}
      />
    </div>
  );
}
