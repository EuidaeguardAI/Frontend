"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  MAX_SENT_CHARS,
  MAX_SENT_ENTRIES,
  selectKnowledgeForAnalysis,
  useStoreKnowledgeStore,
} from "@/lib/store/storeKnowledgeStore";
import {
  KNOWLEDGE_CATEGORY_LABEL,
  type KnowledgeCategory,
  type StoreKnowledgeEntry,
} from "@/lib/types";
import {
  chipRow,
  counterRow,
  emptyState,
  entryActions,
  entryBody,
  entryBodyClamped,
  entryCategory,
  entryDisabled,
  entryMain,
  entryRow,
  entryTitle,
  field,
  fieldLabel,
  formActions,
  iconButton,
  iconButtonDanger,
  list,
  notice,
  textArea,
  textInput,
} from "./page.css";

const CATEGORIES = Object.keys(KNOWLEDGE_CATEGORY_LABEL) as KnowledgeCategory[];

const PLACEHOLDER: Record<KnowledgeCategory, { title: string; body: string }> = {
  refund_policy: {
    title: "예: 개봉한 식품 환불",
    body: "예: 개봉·취식한 식품은 원칙적으로 환불하지 않되, 이물·변질이 확인되면 교환 후 본사에 보고한다.",
  },
  product: {
    title: "예: 냉장 도시락",
    body: "예: 도시락은 0~10도 보관 표시. 상온에 2시간 이상 두면 변질 가능하다고 안내한다.",
  },
  frequent_claim: {
    title: "예: 행사 가격이 다르다는 항의",
    body: "예: 행사 종료일이 지난 상품에 붙은 구 라벨 때문에 자주 생긴다. 라벨 날짜를 함께 확인하고 차액은 즉시 환급한다.",
  },
  etc: { title: "예: 야간 단독 근무 원칙", body: "예: 22시 이후에는 문을 잠그고 창구로만 응대한다." },
};

export default function StoreKnowledgePage() {
  const entries = useStoreKnowledgeStore((state) => state.entries);
  const add = useStoreKnowledgeStore((state) => state.add);
  const update = useStoreKnowledgeStore((state) => state.update);
  const remove = useStoreKnowledgeStore((state) => state.remove);
  const toggleEnabled = useStoreKnowledgeStore((state) => state.toggleEnabled);

  // 폼이 열려 있는지. editingId가 있으면 그 항목을 고치는 중이다.
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<KnowledgeCategory>("refund_policy");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // 실제로 분석에 실려 가는 항목. 상한을 넘겨 등록하면 뒤쪽은 빠지므로 그 사실을 보여준다.
  const sent = useMemo(() => selectKnowledgeForAnalysis(entries), [entries]);
  const sentIds = useMemo(() => new Set(sent.map((entry) => entry.id)), [sent]);

  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setTitle("");
    setBody("");
    setCategory("refund_policy");
  };

  const openNewForm = () => {
    setEditingId(null);
    setTitle("");
    setBody("");
    setCategory("refund_policy");
    setFormOpen(true);
  };

  const openEditForm = (entry: StoreKnowledgeEntry) => {
    setEditingId(entry.id);
    setCategory(entry.category);
    setTitle(entry.title);
    setBody(entry.body);
    setFormOpen(true);
  };

  const canSave = body.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const trimmedTitle = title.trim() || KNOWLEDGE_CATEGORY_LABEL[category];
    if (editingId) {
      update(editingId, { category, title: trimmedTitle, body: body.trim() });
    } else {
      add({ category, title: trimmedTitle, body });
    }
    resetForm();
  };

  return (
    <MobileFrame>
      <PageHeader title="내 매장 규정" />

      <Card tone="primary">
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
          <ShieldCheck size={18} />
          이 기기에만 저장됩니다
        </span>
        <p className={notice} style={{ marginTop: 8 }}>
          여기에 적은 내용은 서버에 저장되지 않습니다. 상담 중 답변을 만들 때만 함께 보내져
          &quot;저희 매장 기준으로는...&quot; 안내에 반영됩니다. 법령·공식 고시와는 구분해서
          안내되며, 답변 근거(인용)로는 쓰이지 않습니다.
        </p>
      </Card>

      {formOpen ? (
        <Card>
          <SectionTitle>{editingId ? "규정 수정" : "규정 추가"}</SectionTitle>

          <div className={field}>
            <span className={fieldLabel}>분류</span>
            <div className={chipRow}>
              {CATEGORIES.map((value) => (
                <Chip
                  key={value}
                  selected={category === value}
                  onClick={() => setCategory(value)}
                >
                  {KNOWLEDGE_CATEGORY_LABEL[value]}
                </Chip>
              ))}
            </div>
          </div>

          <div className={field}>
            <span className={fieldLabel}>제목 (선택)</span>
            <input
              className={textInput}
              placeholder={PLACEHOLDER[category].title}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className={field}>
            <span className={fieldLabel}>내용</span>
            <textarea
              className={textArea}
              placeholder={PLACEHOLDER[category].body}
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </div>

          <div className={formActions}>
            <Button variant="secondary" onClick={resetForm}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!canSave}>
              {editingId ? "수정 완료" : "등록"}
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="primary" size="lg" fullWidth onClick={openNewForm}>
          <Plus size={18} style={{ marginRight: 6 }} />
          규정 추가
        </Button>
      )}

      <div className={counterRow}>
        <span>등록 {entries.length}건</span>
        <span>
          분석에 사용 {sent.length}건 (최대 {MAX_SENT_ENTRIES}건 · {MAX_SENT_CHARS}자)
        </span>
      </div>

      {entries.length === 0 ? (
        <Card>
          <p className={emptyState}>
            아직 등록한 규정이 없습니다.
            <br />
            환불 기준이나 자주 오는 클레임을 한 건씩 적어 두면
            <br />
            그 매장에 맞는 답변이 나옵니다.
          </p>
        </Card>
      ) : (
        <div className={list}>
          {entries.map((entry) => {
            const expanded = expandedId === entry.id;
            // 켜 뒀는데도 상한에 걸려 빠진 항목은 그 사실을 알려 준다.
            const droppedByLimit = entry.enabled && !sentIds.has(entry.id);
            return (
              <Card key={entry.id} className={entry.enabled ? undefined : entryDisabled}>
                <div className={entryRow}>
                  <button
                    type="button"
                    className={entryMain}
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                  >
                    <span className={entryCategory}>
                      {KNOWLEDGE_CATEGORY_LABEL[entry.category]}
                      {!entry.enabled && " · 사용 안 함"}
                      {droppedByLimit && " · 분량 초과로 제외됨"}
                    </span>
                    <p className={entryTitle}>{entry.title}</p>
                    <p className={expanded ? entryBody : entryBodyClamped}>{entry.body}</p>
                  </button>

                  <div className={entryActions}>
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => toggleEnabled(entry.id)}
                      aria-label={entry.enabled ? "분석에서 제외" : "분석에 사용"}
                    >
                      {entry.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => openEditForm(entry)}
                      aria-label="수정"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className={iconButtonDanger}
                      onClick={() =>
                        setConfirmDeleteId((id) => (id === entry.id ? null : entry.id))
                      }
                      aria-label="삭제"
                    >
                      {confirmDeleteId === entry.id ? <X size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>

                {confirmDeleteId === entry.id && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      remove(entry.id);
                      setConfirmDeleteId(null);
                    }}
                    style={{ marginTop: 8 }}
                  >
                    이 규정을 삭제합니다
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </MobileFrame>
  );
}
