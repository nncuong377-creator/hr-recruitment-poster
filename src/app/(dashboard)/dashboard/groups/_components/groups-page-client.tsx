"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "../../content/_components/pagination";
import { GroupFilterBar } from "./group-filter-bar";
import { GroupTable, type FbGroupItem } from "./group-table";
import { GroupFormDialog } from "./group-form-dialog";
import { DeleteGroupDialog } from "./delete-group-dialog";

interface Stats { total: number; active: number; inactive: number }

export function GroupsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1", 10));

  const [items, setItems] = useState<FbGroupItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState<FbGroupItem | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<FbGroupItem | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateUrl(params: Record<string, string>) {
    const merged: Record<string, string> = { search, category, status, page: String(page), ...params };
    const sp = new URLSearchParams();
    if (merged.search) sp.set("search", merged.search);
    if (merged.category) sp.set("category", merged.category);
    if (merged.status) sp.set("status", merged.status);
    if (merged.page && merged.page !== "1") sp.set("page", merged.page);
    router.replace(`/dashboard/groups${sp.toString() ? "?" + sp.toString() : ""}`, { scroll: false });
  }

  const fetchGroups = useCallback(async (
    q: { search: string; category: string; status: string; page: number }
  ) => {
    setIsLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(q.page), limit: "20" });
      if (q.search) sp.set("search", q.search);
      if (q.category) sp.set("category", q.category);
      if (q.status) sp.set("status", q.status);
      const res = await fetch(`/api/groups?${sp.toString()}`);
      const json = await res.json();
      setItems(json.items ?? []);
      setStats(json.stats ?? { total: 0, active: 0, inactive: 0 });
      setTotalPages(json.totalPages ?? 1);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups({ search, category, status, page });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, page]);

  function handleSearchChange(v: string) {
    setSearch(v); setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      updateUrl({ search: v, page: "1" });
      fetchGroups({ search: v, category, status, page: 1 });
    }, 300);
  }

  function handleCategoryChange(v: string) { setCategory(v); setPage(1); updateUrl({ category: v, page: "1" }); }
  function handleStatusChange(v: string) { setStatus(v); setPage(1); updateUrl({ status: v, page: "1" }); }
  function handlePageChange(p: number) { setPage(p); updateUrl({ page: String(p) }); window.scrollTo({ top: 0, behavior: "smooth" }); }

  function handleClearFilters() {
    setSearch(""); setCategory(""); setStatus(""); setPage(1);
    router.replace("/dashboard/groups", { scroll: false });
    fetchGroups({ search: "", category: "", status: "", page: 1 });
  }

  const refetch = useCallback(() => fetchGroups({ search, category, status, page }), [fetchGroups, search, category, status, page]);
  const hasActiveFilters = !!(search || category || status);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facebook Groups</h2>
          <p className="text-sm text-muted-foreground">Quản lý danh sách nhóm để đăng bài tuyển dụng</p>
        </div>
        <Button onClick={() => { setEditGroup(null); setShowForm(true); }} className="gap-2">
          <Plus className="size-4" />Thêm group
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng group", value: stats.total, icon: "👥" },
          { label: "Đang active", value: stats.active, icon: "✅" },
          { label: "Không active", value: stats.inactive, icon: "⏸️" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-lg border bg-background p-4">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <GroupFilterBar
        search={search} category={category} status={status}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="size-5 animate-pulse" />
            <span>Đang tải...</span>
          </div>
        </div>
      ) : (
        <GroupTable
          items={items}
          onEdit={(g) => { setEditGroup(g); setShowForm(true); }}
          onDelete={(g) => setDeleteGroup(g)}
          onRefresh={refetch}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />

      <GroupFormDialog
        open={showForm}
        mode={editGroup ? "edit" : "create"}
        group={editGroup}
        onClose={() => setShowForm(false)}
        onSaved={refetch}
      />

      <DeleteGroupDialog
        group={deleteGroup}
        onClose={() => setDeleteGroup(null)}
        onDeleted={refetch}
      />
    </div>
  );
}
