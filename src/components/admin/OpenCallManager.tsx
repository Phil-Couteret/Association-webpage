import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Link2, FileAudio, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContextNew";

interface RebookingRow {
  id: number;
  booking_date: string;
}

interface OpenCallSubmission {
  id: number;
  email: string;
  whatsapp: string;
  first_name: string;
  last_name: string;
  dj_name: string;
  musical_style: string;
  mix_link: string | null;
  mix_file_path: string | null;
  mix_file_original_name: string | null;
  photo_path: string | null;
  promo_consent: boolean;
  selected: boolean;
  selection_date: string | null;
  rebooking_possible: boolean;
  future_session?: boolean;
  archived?: boolean;
  created_at: string;
  updated_at: string | null;
  ip_address: string | null;
  rebooking_dates: RebookingRow[];
  promoted_artist_id?: number | null;
  promoted_member_id?: number | null;
}

function publicAssetUrl(path: string): string {
  const p = path.trim();
  if (!p) return "";
  return p.startsWith("/") ? p : `/${p}`;
}

function fileExtension(name: string | null, filePath: string | null): string {
  const src = name || filePath || "";
  const base = src.split("/").pop() || "";
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
}

function canPlayInBrowser(ext: string): boolean {
  return ["mp3", "wav", "ogg", "opus", "m4a", "aac", "webm", "flac"].includes(ext);
}

function OpenCallSubmissionEditor({
  s,
  onSaved,
  canPromoteToArtist,
  canPromoteToMember,
}: {
  s: OpenCallSubmission;
  onSaved: () => void;
  canPromoteToArtist: boolean;
  canPromoteToMember: boolean;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [archived, setArchived] = useState(!!s.archived);
  const [futureSession, setFutureSession] = useState(!!s.future_session);
  const [selected, setSelected] = useState(s.selected);
  const [selectionDate, setSelectionDate] = useState("");
  const [rebookingPossible, setRebookingPossible] = useState(false);
  const [rebookingDateInputs, setRebookingDateInputs] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [deleteMixOpen, setDeleteMixOpen] = useState(false);
  const [deletingMix, setDeletingMix] = useState(false);
  const [promotingArtist, setPromotingArtist] = useState(false);
  const [promotingMember, setPromotingMember] = useState(false);

  useEffect(() => {
    setArchived(!!s.archived);
    setFutureSession(!!s.future_session);
    setSelected(s.selected);
    setSelectionDate(s.selection_date ? s.selection_date.slice(0, 10) : "");
    setRebookingPossible(s.rebooking_possible);
    setRebookingDateInputs(
      s.rebooking_dates.length > 0
        ? s.rebooking_dates.map((r) => r.booking_date.slice(0, 10))
        : [""]
    );
  }, [
    s.id,
    s.archived,
    s.future_session,
    s.selected,
    s.selection_date,
    s.rebooking_possible,
    s.rebooking_dates,
    s.mix_file_path,
    s.promoted_artist_id,
    s.promoted_member_id,
  ]);

  const mixFileUrl = s.mix_file_path ? publicAssetUrl(s.mix_file_path) : null;
  const mixExt = fileExtension(s.mix_file_original_name, s.mix_file_path);
  const hasUploadedMix = !!s.mix_file_path;

  const save = async () => {
    const dates = rebookingPossible
      ? rebookingDateInputs.map((d) => d.trim()).filter(Boolean)
      : [];
    if (selected && !selectionDate) {
      toast({
        title: t("admin.openCall.saveError"),
        description: t("admin.openCall.selectionDate"),
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/open-call-admin-save.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: s.id,
          archived,
          future_session: futureSession,
          selected,
          selection_date: selected ? selectionDate : null,
          rebooking_possible: rebookingPossible,
          rebooking_dates: dates,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "save failed");
      }
      toast({ title: t("admin.openCall.saved") });
      onSaved();
    } catch (e) {
      toast({
        title: t("admin.openCall.saveError"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteMix = async () => {
    setDeletingMix(true);
    try {
      const res = await fetch("/api/open-call-admin-delete-mix.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: s.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "delete failed");
      }
      toast({ title: t("admin.openCall.deleteMixDone") });
      setDeleteMixOpen(false);
      onSaved();
    } catch (e) {
      toast({
        title: t("admin.openCall.saveError"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setDeletingMix(false);
    }
  };

  const promoteToArtist = async () => {
    setPromotingArtist(true);
    try {
      const res = await fetch("/api/open-call-promote-to-artist.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: s.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "promote failed");
      }
      const aid = data.artistId as number | undefined;
      if (data.alreadyLinked && aid) {
        toast({ title: t("admin.openCall.promoteAlready") });
      } else {
        toast({ title: t("admin.openCall.promoteDone") });
      }
      onSaved();
    } catch (e) {
      toast({
        title: t("admin.openCall.promoteError"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPromotingArtist(false);
    }
  };

  const promoteToMember = async () => {
    setPromotingMember(true);
    try {
      const res = await fetch("/api/open-call-promote-to-member.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: s.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "promote failed");
      }
      if (data.alreadyLinked && data.memberId) {
        toast({ title: t("admin.openCall.promoteMemberAlready") });
      } else {
        toast({
          title: t("admin.openCall.promoteMemberDone"),
          description: t("admin.openCall.memberSyncDoneDetail", { id: String(data.memberId ?? "") }),
        });
      }
      if (data.linkStored === false) {
        toast({
          title: t("admin.openCall.promoteMemberLinkPendingTitle"),
          description: t("admin.openCall.promoteMemberLinkPendingBody"),
        });
      }
      onSaved();
    } catch (e) {
      toast({
        title: t("admin.openCall.promoteMemberError"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPromotingMember(false);
    }
  };

  const addRebookingRow = () => setRebookingDateInputs((prev) => [...prev, ""]);
  const removeRebookingRow = (index: number) =>
    setRebookingDateInputs((prev) => prev.filter((_, i) => i !== index));
  const setRebookingAt = (index: number, value: string) =>
    setRebookingDateInputs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

  return (
    <div className="space-y-6 text-sm pt-2 border-t border-white/10">
      <div className="space-y-3">
        <p className="text-electric-blue font-medium">{t("admin.openCall.readonly")}</p>
        <p>
          <span className="text-white/60">
            {s.first_name} {s.last_name}
          </span>
          {" · "}
          <span className="text-white/60">{s.whatsapp}</span>
        </p>
        <p className="whitespace-pre-wrap text-white/90">{s.musical_style}</p>

        <div className="rounded-lg border border-white/15 bg-black/30 p-4 space-y-3">
          <p className="text-white font-medium">{t("admin.openCall.col.mix")}</p>
          {s.mix_link && (
            <div className="space-y-2">
              <a
                href={s.mix_link}
                className="inline-flex items-center gap-2 text-electric-blue underline break-all"
                target="_blank"
                rel="noreferrer"
              >
                <Link2 className="h-4 w-4 shrink-0" />
                {s.mix_link}
              </a>
              <p className="text-xs text-white/50">{t("admin.openCall.mixOpenLink")}</p>
            </div>
          )}
          {mixFileUrl && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-white/80">
                <FileAudio className="h-4 w-4 text-electric-blue shrink-0" />
                <span className="break-all">{s.mix_file_original_name || s.mix_file_path}</span>
              </div>
              {mixExt === "zip" ? (
                <p className="text-sm text-amber-200/90">{t("admin.openCall.mixZipHint")}</p>
              ) : canPlayInBrowser(mixExt) ? (
                <div className="space-y-1">
                  <p className="text-xs text-white/50">{t("admin.openCall.mixPlay")}</p>
                  <audio controls className="w-full max-w-md h-10" src={mixFileUrl} preload="metadata" />
                </div>
              ) : null}
              <div>
                <a
                  href={mixFileUrl}
                  download={s.mix_file_original_name || undefined}
                  className="inline-flex text-electric-blue underline"
                >
                  {t("admin.openCall.mixDownload")}
                </a>
              </div>
            </div>
          )}
          {!s.mix_link && !mixFileUrl && (
            <p className="text-white/40">—</p>
          )}
        </div>

        {s.photo_path && (
          <div>
            <p className="text-white/50 mb-1">{t("admin.openCall.photo")}</p>
            <img
              src={publicAssetUrl(s.photo_path)}
              alt=""
              className="max-h-40 rounded border border-white/10 object-contain"
            />
          </div>
        )}
        <p className="text-white/70">
          {t("admin.openCall.promoConsent")}: {s.promo_consent ? t("admin.openCall.yes") : "—"}
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-white/20 bg-black/35 p-4 mt-4">
        <p className="text-white font-semibold text-base">{t("admin.openCall.adminSection")}</p>

        {(canPromoteToArtist || canPromoteToMember) && (
          <div className="space-y-4 pb-2 border-b border-white/10">
            {canPromoteToArtist && (
              <div className="space-y-2">
                {s.promoted_artist_id ? (
                  <p className="text-sm text-white/85">
                    <a
                      href={`/artist/${s.promoted_artist_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-electric-blue underline font-medium"
                    >
                      {t("admin.openCall.promoteViewArtist")}
                    </a>
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-electric-blue/50 text-electric-blue hover:bg-electric-blue/10"
                    onClick={() => void promoteToArtist()}
                    disabled={promotingArtist || promotingMember}
                  >
                    {promotingArtist ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {t("admin.openCall.promoteToArtist")}
                  </Button>
                )}
                <p className="text-xs text-white/50">{t("admin.openCall.promoteHint")}</p>
              </div>
            )}
            {canPromoteToMember && (
              <div className="space-y-2">
                {s.promoted_member_id ? (
                  <p className="text-sm text-white/85">
                    <span className="text-electric-blue font-medium">
                      {t("admin.openCall.promoteViewMember", { id: String(s.promoted_member_id) })}
                    </span>
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-green-500/50 text-green-200 hover:bg-green-950/30"
                    onClick={() => void promoteToMember()}
                    disabled={promotingArtist || promotingMember}
                  >
                    {promotingMember ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    {t("admin.openCall.promoteToMember")}
                  </Button>
                )}
                <p className="text-xs text-white/50">{t("admin.openCall.promoteMemberHint")}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-2">
          <Checkbox
            id={`oc-archived-${s.id}`}
            checked={archived}
            onCheckedChange={(c) => setArchived(c === true)}
            className="border-white/60 data-[state=checked]:bg-electric-blue data-[state=checked]:border-electric-blue data-[state=checked]:text-deep-purple mt-0.5"
          />
          <div>
            <Label htmlFor={`oc-archived-${s.id}`} className="cursor-pointer font-normal text-white">
              {t("admin.openCall.archived")}
            </Label>
            <p className="text-xs text-white/55 mt-1">{t("admin.openCall.archivedHint")}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id={`oc-future-${s.id}`}
            checked={futureSession}
            onCheckedChange={(c) => setFutureSession(c === true)}
            className="border-white/60 data-[state=checked]:bg-electric-blue data-[state=checked]:border-electric-blue data-[state=checked]:text-deep-purple mt-0.5"
          />
          <div>
            <Label htmlFor={`oc-future-${s.id}`} className="cursor-pointer font-normal text-white">
              {t("admin.openCall.futureSession")}
            </Label>
            <p className="text-xs text-white/55 mt-1">{t("admin.openCall.futureSessionHint")}</p>
          </div>
        </div>

        {hasUploadedMix && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-amber-500/50 text-amber-200 hover:bg-amber-950/40"
              onClick={() => setDeleteMixOpen(true)}
            >
              {t("admin.openCall.deleteMixFile")}
            </Button>
            <AlertDialog open={deleteMixOpen} onOpenChange={setDeleteMixOpen}>
              <AlertDialogContent className="bg-deep-purple border-white/20 text-white max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("admin.openCall.deleteMixTitle")}</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/75">
                    {t("admin.openCall.deleteMixDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={() => setDeleteMixOpen(false)}
                    disabled={deletingMix}
                  >
                    {t("admin.openCall.cancel")}
                  </Button>
                  <Button
                    type="button"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => void confirmDeleteMix()}
                    disabled={deletingMix}
                  >
                    {deletingMix ? t("admin.openCall.saving") : t("admin.openCall.deleteMixConfirm")}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <Checkbox
            id={`oc-selected-${s.id}`}
            checked={selected}
            onCheckedChange={(c) => setSelected(c === true)}
            className="border-white/60 data-[state=checked]:bg-electric-blue data-[state=checked]:border-electric-blue data-[state=checked]:text-deep-purple"
          />
          <Label htmlFor={`oc-selected-${s.id}`} className="cursor-pointer font-normal text-white">
            {t("admin.openCall.selected")}
          </Label>
        </div>
        <p className="text-xs text-white/45 -mt-1 pl-7">{t("admin.openCall.selectedMemberHint")}</p>
        {selected && (
          <div className="space-y-1">
            <Label htmlFor={`oc-sel-date-${s.id}`} className="text-white/90">
              {t("admin.openCall.selectionDate")}
            </Label>
            <Input
              id={`oc-sel-date-${s.id}`}
              type="date"
              value={selectionDate}
              onChange={(e) => setSelectionDate(e.target.value)}
              className="bg-black/50 border-white/30 text-white max-w-xs"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Checkbox
            id={`oc-rebook-${s.id}`}
            checked={rebookingPossible}
            onCheckedChange={(c) => {
              setRebookingPossible(c === true);
              if (c === true && rebookingDateInputs.length === 0) {
                setRebookingDateInputs([""]);
              }
            }}
            className="border-white/60 data-[state=checked]:bg-electric-blue data-[state=checked]:border-electric-blue data-[state=checked]:text-deep-purple"
          />
          <Label htmlFor={`oc-rebook-${s.id}`} className="cursor-pointer font-normal text-white">
            {t("admin.openCall.rebookingPossible")}
          </Label>
        </div>
        {rebookingPossible && (
          <div className="space-y-2 pl-1">
            <Label className="text-white/90">{t("admin.openCall.rebookingDates")}</Label>
            {rebookingDateInputs.map((d, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  type="date"
                  value={d}
                  onChange={(e) => setRebookingAt(i, e.target.value)}
                  className="bg-black/50 border-white/30 text-white flex-1 max-w-xs"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-red-400 shrink-0"
                  onClick={() => removeRebookingRow(i)}
                  disabled={rebookingDateInputs.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={addRebookingRow}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("admin.openCall.addDate")}
            </Button>
          </div>
        )}
      </div>

      <Button onClick={save} disabled={saving} className="bg-electric-blue text-deep-purple mt-4">
        {saving ? t("admin.openCall.saving") : t("admin.openCall.save")}
      </Button>
    </div>
  );
}

type ListScope = "active" | "archived" | "all";

const OpenCallManager = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { canAccessSection } = useAuth();
  const canPromoteToArtist = canAccessSection("artists");
  const canPromoteToMember = canAccessSection("members");
  const [rows, setRows] = useState<OpenCallSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [listScope, setListScope] = useState<ListScope>("active");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/open-call-admin-list.php?scope=${encodeURIComponent(listScope)}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed");
      }
      setRows(data.submissions || []);
    } catch {
      toast({ title: t("openCall.error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [t, toast, listScope]);

  useEffect(() => {
    load();
  }, [load]);

  const mixSummary = (s: OpenCallSubmission) => {
    if (s.mix_link) {
      return (
        <a
          href={s.mix_link}
          target="_blank"
          rel="noreferrer"
          className="text-electric-blue underline truncate max-w-[200px] md:max-w-xs inline-block align-bottom"
          onClick={(e) => e.stopPropagation()}
        >
          {t("admin.openCall.mixOpenLink")}
        </a>
      );
    }
    if (s.mix_file_path) {
      const url = publicAssetUrl(s.mix_file_path);
      const label = s.mix_file_original_name || s.mix_file_path.split("/").pop() || "file";
      return (
        <div className="flex flex-col gap-0.5 min-w-0 max-w-[220px] md:max-w-md">
          <a
            href={url}
            className="text-electric-blue underline truncate"
            onClick={(e) => e.stopPropagation()}
            download={s.mix_file_original_name || undefined}
          >
            {label}
          </a>
          <span className="text-[10px] sm:text-xs text-white/45 leading-snug">
            {t("admin.openCall.expandForPlayer")}
          </span>
        </div>
      );
    }
    return <span className="text-white/35">—</span>;
  };

  const emptyMessage =
    listScope === "archived" ? t("admin.openCall.emptyArchived") : t("admin.openCall.empty");

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">{t("admin.openCall.title")}</CardTitle>
        <CardDescription className="text-white/70">{t("admin.openCall.subtitle")}</CardDescription>
        <div className="flex flex-wrap gap-2 pt-3">
          {(["active", "archived", "all"] as const).map((scope) => (
            <Button
              key={scope}
              type="button"
              size="sm"
              variant={listScope === scope ? "default" : "outline"}
              className={
                listScope === scope
                  ? "bg-electric-blue text-deep-purple hover:bg-electric-blue/90"
                  : "border-white/30 text-white hover:bg-white/10"
              }
              onClick={() => setListScope(scope)}
            >
              {scope === "active"
                ? t("admin.openCall.listActive")
                : scope === "archived"
                  ? t("admin.openCall.listArchived")
                  : t("admin.openCall.listAll")}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-white/80">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("admin.openCall.loading")}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-white/60">{emptyMessage}</p>
        ) : (
          <Accordion type="multiple" className="w-full border border-white/10 rounded-md px-2 md:px-4">
            {rows.map((s) => (
              <AccordionItem key={s.id} value={`oc-${s.id}`} className="border-white/10">
                <AccordionTrigger className="hover:no-underline py-3 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 w-full items-center pr-2 text-sm">
                    <span className="lg:col-span-2 text-white/80 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString()}
                    </span>
                    <span className="lg:col-span-2 font-medium text-white flex flex-wrap items-center gap-1">
                      {s.dj_name}
                      {s.archived && (
                        <Badge variant="outline" className="text-[10px] border-white/30 text-white/70">
                          {t("admin.openCall.badgeArchived")}
                        </Badge>
                      )}
                      {s.future_session && (
                        <Badge variant="outline" className="text-[10px] border-blue-400/40 text-blue-200/90">
                          {t("admin.openCall.badgeFuture")}
                        </Badge>
                      )}
                    </span>
                    <span className="lg:col-span-3 truncate text-white/90">{s.email}</span>
                    <span className="lg:col-span-3 min-w-0">{mixSummary(s)}</span>
                    <span className="lg:col-span-2 flex items-center gap-2">
                      {s.selected ? (
                        <Badge className="bg-green-600/80">{t("admin.openCall.yes")}</Badge>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                      <span className="text-xs text-white/40 hidden sm:inline">{t("admin.openCall.view")}</span>
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <OpenCallSubmissionEditor
                    s={s}
                    onSaved={load}
                    canPromoteToArtist={canPromoteToArtist}
                    canPromoteToMember={canPromoteToMember}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenCallManager;
