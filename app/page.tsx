"use client";

import {
  Bookmark,
  ChevronDown,
  Clock3,
  Heart,
  ListMusic,
  MessageCircle,
  Music2,
  Palette,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Send,
  Share2,
  SkipBack,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const SONG = {
  id: "kangding-love-song-preview-v2",
  title: "康定情歌",
  artist: "成方圆",
  audio:
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/2a/f5/98/2af5983d-5a64-77d6-2c41-a8084932e347/mzaf_11821463918537745557.plus.aac.p.m4a",
  cover:
    "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/09/2a/ef/092aefde-c538-7470-1eff-e0ebc5d58343/chengfangyuan.jpg/600x600bb.jpg",
};

const INITIAL_TIME = 0;
const FALLBACK_DURATION = 30;
const STORAGE_KEY = `postcard-notes:${SONG.id}`;
const LIKE_KEY = `postcard-liked:${SONG.id}`;

const LYRICS = [
  { time: 0, text: "跑马溜溜的山上" },
  { time: 4.2, text: "一朵溜溜的云哟" },
  { time: 8.6, text: "端端溜溜的照在" },
  { time: 13, text: "康定溜溜的城哟" },
  { time: 17.8, text: "月亮弯弯", peak: true },
  { time: 21.6, text: "康定溜溜的城哟" },
  { time: 26.2, text: "李家溜溜的大姐" },
  { time: 31, text: "人才溜溜的好哟" },
  { time: 35.5, text: "张家溜溜的大哥" },
  { time: 40, text: "看上溜溜的她哟" },
  { time: 44.8, text: "月亮弯弯", peak: true },
  { time: 48.6, text: "看上溜溜的她哟" },
];

const PEAK_WINDOW = 2.6;
const EASTER_EGG_THRESHOLD = 5;

type Lyric = {
  time: number;
  text: string;
  peak?: boolean;
};

type MemoryNote = {
  id: string;
  songId: string;
  time: number;
  lyric: string;
  content: string;
  createdAt: string;
  source?: "local" | "shared";
};

type PostcardTemplateId = "classic" | "record" | "letter";

type PostcardTemplate = {
  id: PostcardTemplateId;
  name: string;
  description: string;
  accent: string;
  accentDeep: string;
  paper: string;
  card: string;
  note: string;
  ink: string;
};

const POSTCARD_TEMPLATES: PostcardTemplate[] = [
  {
    id: "classic",
    name: "经典邮戳",
    description: "暖色邮票感",
    accent: "#b24436",
    accentDeep: "#8b6f48",
    paper: "#efe8dd",
    card: "#f8f1e6",
    note: "#f8edc9",
    ink: "#443d35",
  },
  {
    id: "record",
    name: "唱片歌词",
    description: "封面唱片感",
    accent: "#496d75",
    accentDeep: "#2f555e",
    paper: "#e7ece9",
    card: "#f5f6ef",
    note: "#eaf1e7",
    ink: "#243a3d",
  },
  {
    id: "letter",
    name: "手写信笺",
    description: "留白信纸感",
    accent: "#9b6b85",
    accentDeep: "#76566d",
    paper: "#eee6ef",
    card: "#fbf6ef",
    note: "#fff2d7",
    ink: "#4a3944",
  },
];

const DEFAULT_NOTES: MemoryNote[] = [
  {
    id: "demo-kangding-hills",
    songId: SONG.id,
    time: 3.2,
    lyric: LYRICS[0].text,
    content: "山路一打开，心也跟着亮了一下。",
    createdAt: "2026-07-30T12:00:00.000Z",
    source: "local",
  },
  {
    id: "demo-kangding-cloud",
    songId: SONG.id,
    time: 10.2,
    lyric: LYRICS[2].text,
    content: "这一句像云影落在城墙上。",
    createdAt: "2026-07-30T12:01:00.000Z",
    source: "local",
  },
  {
    id: "demo-kangding-moon",
    songId: SONG.id,
    time: 17.8,
    lyric: LYRICS[4].text,
    content: "月亮弯弯，这里最有民歌的甜。",
    createdAt: "2026-07-30T12:02:00.000Z",
    source: "local",
  },
  {
    id: "demo-kangding-city",
    songId: SONG.id,
    time: 22.4,
    lyric: LYRICS[5].text,
    content: "唱到康定城，像有人在远处招手。",
    createdAt: "2026-07-30T12:03:00.000Z",
    source: "local",
  },
  {
    id: "demo-kangding-sister",
    songId: SONG.id,
    time: 26.2,
    lyric: LYRICS[6].text,
    content: "故事开始拐进人群，忽然就热闹了。",
    createdAt: "2026-07-30T12:04:00.000Z",
    source: "local",
  },
];

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

function formatNoteDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  if (now.getUTCFullYear() - date.getUTCFullYear() === 1) {
    return `去年 ${month} 月 ${day} 日`;
  }
  return `${date.getUTCFullYear()} 年 ${month} 月 ${day} 日`;
}

function nearestLyricIndex(time: number) {
  let index = 0;
  for (let i = 0; i < LYRICS.length; i += 1) {
    if (LYRICS[i].time <= time) index = i;
    else break;
  }
  return index;
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  let current = "";
  for (const char of text) {
    const next = `${current}${char}`;
    if (context.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function getPostcardTemplate(templateId: PostcardTemplateId) {
  return (
    POSTCARD_TEMPLATES.find((template) => template.id === templateId) ??
    POSTCARD_TEMPLATES[0]
  );
}

async function createPostcardCanvas(
  note: MemoryNote,
  templateId: PostcardTemplateId = "classic",
) {
  const template = getPostcardTemplate(templateId);
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1240;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported");

  context.fillStyle = template.paper;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.shadowColor = "rgba(56, 48, 39, 0.22)";
  context.shadowBlur = 36;
  context.shadowOffsetY = 20;
  drawRoundedRect(context, 58, 54, 784, 1118, 36);
  context.fillStyle = template.card;
  context.fill();
  context.restore();

  if (template.id === "letter") {
    context.strokeStyle = "rgba(118, 86, 109, 0.12)";
    context.lineWidth = 2;
    for (let y = 858; y <= 1040; y += 58) {
      context.beginPath();
      context.moveTo(108, y);
      context.lineTo(792, y);
      context.stroke();
    }
  }

  drawRoundedRect(context, 86, 86, 728, 728, 28);
  context.save();
  context.clip();
  try {
    const cover = await loadImage(SONG.cover);
    const sourceSize = Math.min(cover.naturalWidth, cover.naturalHeight);
    const sourceX = (cover.naturalWidth - sourceSize) / 2;
    const sourceY = (cover.naturalHeight - sourceSize) / 2;
    context.drawImage(
      cover,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      86,
      86,
      728,
      728,
    );
  } catch {
    const fallback = context.createLinearGradient(86, 86, 814, 814);
    fallback.addColorStop(0, "#d8cfbf");
    fallback.addColorStop(1, "#b8a58d");
    context.fillStyle = fallback;
    context.fillRect(86, 86, 728, 728);
  }
  const coverShade = context.createLinearGradient(86, 86, 86, 814);
  coverShade.addColorStop(0, "rgba(255,255,255,0.08)");
  coverShade.addColorStop(1, "rgba(55,42,30,0.25)");
  context.fillStyle = coverShade;
  context.fillRect(86, 86, 728, 728);
  context.restore();

  if (template.id === "record") {
    context.save();
    context.translate(450, 450);
    context.strokeStyle = "rgba(36, 58, 61, 0.58)";
    context.lineWidth = 28;
    context.beginPath();
    context.arc(0, 0, 278, 0, Math.PI * 2);
    context.stroke();
    context.lineWidth = 6;
    context.strokeStyle = "rgba(245, 246, 239, 0.74)";
    context.beginPath();
    context.arc(0, 0, 112, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  context.save();
  context.translate(592, 96);
  context.rotate(0.12);
  context.strokeStyle = template.accent;
  context.lineWidth = 9;
  context.beginPath();
  context.arc(96, 96, 78, 0, Math.PI * 2);
  context.stroke();
  context.font = "700 28px sans-serif";
  context.fillStyle = template.accent;
  context.textAlign = "center";
  context.fillText("音乐明信片", 96, 94);
  context.font = "700 22px sans-serif";
  context.fillText(formatTime(note.time), 96, 128);
  context.restore();

  context.save();
  context.translate(118, 700);
  context.rotate(-0.035);
  context.shadowColor = "rgba(74, 62, 44, 0.18)";
  context.shadowBlur = 18;
  context.shadowOffsetY = 10;
  drawRoundedRect(context, 0, 0, 664, 260, 18);
  context.fillStyle = template.note;
  context.fill();
  context.restore();

  context.fillStyle = template.accentDeep;
  context.font = "28px serif";
  context.textAlign = "left";
  context.fillText(`${formatTime(note.time)}  ♪ “${note.lyric}”`, 148, 770);

  context.fillStyle = template.ink;
  context.font = "52px serif";
  const noteLines = wrapCanvasText(context, note.content, 560).slice(0, 3);
  noteLines.forEach((line, index) => {
    context.fillText(line, 148, 850 + index * 62);
  });

  context.fillStyle = template.ink;
  context.font = "700 42px serif";
  context.fillText(SONG.title, 108, 1044);
  context.fillStyle = template.accentDeep;
  context.font = "30px sans-serif";
  context.fillText(SONG.artist, 108, 1090);
  context.textAlign = "right";
  context.fillText(template.name, 792, 1090);

  return canvas;
}

async function createPostcardFile(
  note: MemoryNote,
  templateId: PostcardTemplateId,
) {
  const canvas = await createPostcardCanvas(note, templateId);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Failed to create postcard image"));
    }, "image/png");
  });
  return new File(
    [blob],
    `${SONG.id}-${templateId}-${Math.round(note.time)}.png`,
    { type: "image/png" },
  );
}

function ActionButton({
  label,
  children,
  active = false,
  onClick,
}: {
  label: string;
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`rail-button ${active ? "is-active" : ""}`}
      onClick={onClick}
      type="button"
      aria-label={label}
    >
      <span className="rail-icon">{children}</span>
      <span>{label}</span>
    </button>
  );
}

function Postcard({
  note,
  isPeak,
  onCoverTap,
  onOpenNote,
  onCloseNote,
}: {
  note: MemoryNote | null;
  isPeak: boolean;
  onCoverTap: () => void;
  onOpenNote: () => void;
  onCloseNote: () => void;
}) {
  return (
    <figure
      className={`postcard${isPeak ? " is-peak" : ""}`}
      aria-label="一张寄往未来的音乐明信片"
    >
      {isPeak ? (
        <>
          <span className="peak-glow peak-glow-a" aria-hidden="true" />
          <span className="peak-glow peak-glow-b" aria-hidden="true" />
          <span className="peak-spark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </>
      ) : null}
      <button
        type="button"
        className="postcard-photo"
        onClick={onCoverTap}
        aria-label="轻触封面，点亮月亮"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SONG.cover}
          alt="成方圆《康定情歌》专辑封面"
        />
      </button>
      <div className="postmark" aria-hidden="true">
        <span className="postmark-arc">心动明信片</span>
        <Heart size={25} fill="currentColor" strokeWidth={1.8} />
        <span className="postmark-brand">KUGOU</span>
      </div>
      <div className="postmark-lines" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      {note ? (
        <div className="postcard-note">
          <FloatingNote note={note} onOpen={onOpenNote} onClose={onCloseNote} />
        </div>
      ) : null}
      <figcaption className="sr-only">
        《康定情歌》音乐明信片封面
      </figcaption>
    </figure>
  );
}

function FloatingNote({
  note,
  onOpen,
  onClose,
}: {
  note: MemoryNote;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="floating-note" role="status" aria-live="polite">
      <button
        className="note-main"
        type="button"
        onClick={onOpen}
        aria-label={`跳转到 ${formatTime(note.time)} 的明信片`}
      >
        <span>{note.content}</span>
        <small>{formatNoteDate(note.createdAt)}</small>
      </button>
      <button
        className="note-close"
        type="button"
        aria-label="关闭明信片"
        onClick={onClose}
      >
        <X size={15} />
      </button>
    </aside>
  );
}

function NoteComposer({
  lyric,
  time,
  onCancel,
  onSave,
}: {
  lyric: string;
  time: number;
  onCancel: () => void;
  onSave: (content: string) => void;
}) {
  const [content, setContent] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (content.trim()) onSave(content.trim());
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <form
        className="composer"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="composer-heading">
          <div>
            <span className="eyebrow">写给未来</span>
            <h2>生成一张音乐明信片</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="关闭编辑">
            <X size={20} />
          </button>
        </div>
        <blockquote>“{lyric}”</blockquote>
        <div className="composer-time">
          <Clock3 size={15} />
          {formatTime(time)}
        </div>
        <textarea
          autoFocus
          maxLength={80}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="那一刻，你在想什么？"
        />
        <div className="composer-footer">
          <span>{content.length}/80</span>
          <button className="primary-button" type="submit" disabled={!content.trim()}>
            <Send size={16} />
            寄出明信片
          </button>
        </div>
      </form>
    </div>
  );
}

function BottomSheet({
  mode,
  notes,
  selectedShareNoteId,
  shareTemplateId,
  sharePreviewUrl,
  isGeneratingShare,
  onClose,
  onSelectNote,
  onDeleteNote,
  onSelectShareNote,
  onSelectShareTemplate,
  onShare,
}: {
  mode: "history" | "comments" | "share";
  notes: MemoryNote[];
  selectedShareNoteId: string;
  shareTemplateId: PostcardTemplateId;
  sharePreviewUrl: string;
  isGeneratingShare: boolean;
  onClose: () => void;
  onSelectNote: (note: MemoryNote) => void;
  onDeleteNote: (note: MemoryNote) => void;
  onSelectShareNote: (note: MemoryNote) => void;
  onSelectShareTemplate: (templateId: PostcardTemplateId) => void;
  onShare: () => void;
}) {
  const sortedNotes = [...notes].sort((a, b) => a.time - b.time);
  const sheetTitle =
    mode === "history"
      ? "这首歌里的明信片"
      : mode === "share"
        ? "分享音乐明信片"
        : "94 条评论";
  const sheetEyebrow =
    mode === "history" ? "时光邮局" : mode === "share" ? "分享" : "听友留言";

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="bottom-sheet"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label={sheetTitle}
      >
        <div className="sheet-handle" />
        <header>
          <div>
            <span className="eyebrow">{sheetEyebrow}</span>
            <h2>{sheetTitle}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>

        {mode === "history" ? (
          <div className="history-list">
            {notes.length ? (
              sortedNotes.map((note) => (
                <article className="history-item" key={note.id}>
                  <button type="button" onClick={() => onSelectNote(note)}>
                    <span className="history-time">{formatTime(note.time)}</span>
                    <small className="lyric-quote">
                      <Music2 size={12} aria-hidden="true" />
                      <span>“{note.lyric}”</span>
                    </small>
                    <strong>{note.content}</strong>
                  </button>
                  <button
                    className="delete-note"
                    type="button"
                    onClick={() => onDeleteNote(note)}
                    aria-label={`删除明信片：${note.content}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <Music2 size={24} />
                <p>还没有明信片。等某句歌词经过时，写下一点什么吧。</p>
              </div>
            )}
          </div>
        ) : mode === "share" ? (
          <div className="share-list">
            {sharePreviewUrl ? (
              <figure className="share-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sharePreviewUrl} alt="音乐明信片分享预览" />
                <figcaption>当前预览会直接生成分享图片</figcaption>
              </figure>
            ) : (
              <div className="share-preview-placeholder">
                <Palette size={22} />
                <span>正在生成预览</span>
              </div>
            )}
            <div className="template-picker" aria-label="选择明信片模板">
              {POSTCARD_TEMPLATES.map((template) => (
                <button
                  className={template.id === shareTemplateId ? "is-selected" : ""}
                  type="button"
                  key={template.id}
                  onClick={() => onSelectShareTemplate(template.id)}
                >
                  <span
                    className="template-swatch"
                    style={
                      {
                        "--swatch-accent": template.accent,
                        "--swatch-paper": template.paper,
                      } as React.CSSProperties
                    }
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{template.name}</strong>
                    <small>{template.description}</small>
                  </span>
                </button>
              ))}
            </div>
            <button
              className="primary-button share-action"
              type="button"
              disabled={!selectedShareNoteId || isGeneratingShare}
              onClick={onShare}
            >
              <Share2 size={16} />
              {isGeneratingShare ? "生成中" : "分享这张明信片"}
            </button>
            <div className="share-list-heading">换一张</div>
            {notes.length ? (
              sortedNotes.map((note) => (
                <button
                  type="button"
                  className={`share-item${note.id === selectedShareNoteId ? " is-selected" : ""}`}
                  key={note.id}
                  onClick={() => onSelectShareNote(note)}
                >
                  <span className="history-time">{formatTime(note.time)}</span>
                  <span className="share-item-body">
                    <small className="lyric-quote">
                      <Music2 size={12} aria-hidden="true" />
                      <span>“{note.lyric}”</span>
                    </small>
                    <strong>{note.content}</strong>
                  </span>
                </button>
              ))
            ) : (
              <div className="empty-state">
                <Music2 size={24} />
                <p>还没有可分享的明信片。</p>
              </div>
            )}
          </div>
        ) : (
          <div className="comment-list">
            <article>
              <span className="comment-avatar">L</span>
              <div>
                <strong>鹿岛晚风</strong>
                <p>有些歌不是听完的，是慢慢住进心里的。</p>
              </div>
            </article>
            <article>
              <span className="comment-avatar warm">M</span>
              <div>
                <strong>木棉</strong>
                <p>刚好在回家的路上听到，今天也变得柔软了。</p>
              </div>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const shareSeekRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(INITIAL_TIME);
  const [duration, setDuration] = useState(FALLBACK_DURATION);
  const [notes, setNotes] = useState<MemoryNote[]>(DEFAULT_NOTES);
  const [dismissedNoteId, setDismissedNoteId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [composerMoment, setComposerMoment] = useState<{
    time: number;
    lyric: string;
  } | null>(null);
  const [sheetMode, setSheetMode] = useState<"history" | "comments" | "share" | null>(
    null,
  );
  const [selectedShareNoteId, setSelectedShareNoteId] = useState<string>("");
  const [shareTemplateId, setShareTemplateId] =
    useState<PostcardTemplateId>("classic");
  const [sharePreviewUrl, setSharePreviewUrl] = useState("");
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [toast, setToast] = useState("");
  const [showEgg, setShowEgg] = useState(false);
  const [isSharedVisit, setIsSharedVisit] = useState(false);

  const lyricIndex = useMemo(() => nearestLyricIndex(currentTime), [currentTime]);
  const currentLyric: Lyric = LYRICS[lyricIndex];
  const nextLyric = LYRICS[Math.min(lyricIndex + 1, LYRICS.length - 1)];
  const currentMomentNote = notes.find(
    (note) => Math.abs(note.time - currentTime) <= 1.2,
  );
  const timelineNote = useMemo(() => {
    return [...notes]
      .filter((note) => note.time <= currentTime + 0.2)
      .sort((a, b) => b.time - a.time)[0] ?? null;
  }, [currentTime, notes]);
  const displayedNote = timelineNote?.id === dismissedNoteId ? null : timelineNote;
  const selectedShareNote = useMemo(
    () => notes.find((note) => note.id === selectedShareNoteId) ?? null,
    [notes, selectedShareNoteId],
  );
  const progress = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  const showNote = useCallback((note: MemoryNote) => {
    void note;
    setDismissedNoteId(null);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    let savedNotes: MemoryNote[] | null = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MemoryNote[];
        if (Array.isArray(parsed)) savedNotes = parsed;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTES));
    }
    const savedLiked = window.localStorage.getItem(LIKE_KEY) === "true";

    const params = new URLSearchParams(window.location.search);
    let sharedNote: MemoryNote | null = null;
    let sharedTime: number | null = null;
    if (params.get("song") === SONG.id) {
      const time = Number(params.get("t"));
      if (Number.isFinite(time) && time >= 0) {
        shareSeekRef.current = time;
        sharedTime = time;
      }
      const sharedContent = params.get("note");
      if (sharedContent) {
        sharedNote = {
          id: `shared-${time || 0}`,
          songId: SONG.id,
          time: Number.isFinite(time) ? time : 0,
          lyric: LYRICS[nearestLyricIndex(time || 0)].text,
          content: sharedContent.slice(0, 80),
          createdAt: new Date().toISOString(),
          source: "shared",
        };
      }
    }

    const frame = window.requestAnimationFrame(() => {
      const nextNotes =
        sharedNote && !(savedNotes ?? DEFAULT_NOTES).some((note) => note.id === sharedNote.id)
          ? [...(savedNotes ?? DEFAULT_NOTES), sharedNote]
          : savedNotes;
      if (nextNotes) setNotes(nextNotes);
      setLiked(savedLiked);
      if (sharedTime !== null) setCurrentTime(sharedTime);
      if (sharedNote) {
        showNote(sharedNote);
        setIsSharedVisit(true);
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [showNote]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const isPeak = useMemo(
    () =>
      LYRICS.some(
        (line) => line.peak && Math.abs(line.time - currentTime) <= PEAK_WINDOW / 2,
      ),
    [currentTime],
  );

  const coverTapRef = useRef(0);
  const coverTapTimer = useRef<number | null>(null);

  useEffect(() => {
    if (sheetMode !== "share" || !selectedShareNote) return;
    let cancelled = false;
    createPostcardCanvas(selectedShareNote, shareTemplateId)
      .then((canvas) => {
        if (!cancelled) setSharePreviewUrl(canvas.toDataURL("image/png"));
      })
      .catch(() => {
        if (!cancelled) setSharePreviewUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedShareNote, shareTemplateId, sheetMode]);

  function persistNotes(nextNotes: MemoryNote[]) {
    setNotes(nextNotes);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;
    if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    const target = shareSeekRef.current ?? INITIAL_TIME;
    audio.currentTime = Math.min(target, audio.duration || target);
    setCurrentTime(audio.currentTime);

    if (!new URLSearchParams(window.location.search).get("note")) {
      setDismissedNoteId(null);
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setToast("音频暂时无法播放，请检查网络");
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function seekTo(time: number, shouldPlay = false) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(time, 0), duration);
    setCurrentTime(audio.currentTime);
    if (shouldPlay) {
      audio.play().then(() => setIsPlaying(true)).catch(() => undefined);
    }
  }

  function handleCoverTap() {
    coverTapRef.current += 1;
    if (coverTapRef.current >= EASTER_EGG_THRESHOLD) {
      coverTapRef.current = 0;
      setShowEgg(true);
      setToast("你点亮了康定的月亮");
      window.setTimeout(() => setShowEgg(false), 4000);
    } else {
      window.clearTimeout(coverTapTimer.current);
      coverTapTimer.current = window.setTimeout(() => {
        coverTapRef.current = 0;
      }, 1400);
    }
  }

  function openComposer() {
    if (currentMomentNote) {
      showNote(currentMomentNote);
      return;
    }
    audioRef.current?.pause();
    setIsPlaying(false);
    setComposerMoment({
      time: currentTime,
      lyric: currentLyric.text,
    });
  }

  function saveNote(content: string) {
    if (!composerMoment) return;
    const note: MemoryNote = {
      id: `${Date.now()}-${Math.round(composerMoment.time * 10)}`,
      songId: SONG.id,
      time: Number(composerMoment.time.toFixed(1)),
      lyric: composerMoment.lyric,
      content,
      createdAt: new Date().toISOString(),
      source: "local",
    };
    persistNotes([...notes, note]);
    setComposerMoment(null);
    showNote(note);
    setToast("明信片已寄往未来");
  }

  function selectHistoryNote(note: MemoryNote) {
    setSheetMode(null);
    seekTo(note.time, true);
    showNote(note);
  }

  function deleteNote(note: MemoryNote) {
    persistNotes(notes.filter((item) => item.id !== note.id));
    if (displayedNote?.id === note.id) setDismissedNoteId(null);
    setToast("明信片已移除");
  }

  function openShareSheet() {
    const defaultNote = displayedNote ?? currentMomentNote ?? notes[0];
    setSelectedShareNoteId(defaultNote?.id ?? "");
    setSharePreviewUrl("");
    setSheetMode("share");
  }

  function selectShareNote(note: MemoryNote) {
    setSharePreviewUrl("");
    setSelectedShareNoteId(note.id);
  }

  function selectShareTemplate(templateId: PostcardTemplateId) {
    setSharePreviewUrl("");
    setShareTemplateId(templateId);
  }

  async function shareCurrentNote() {
    if (!selectedShareNote) {
      setToast("先选择一张明信片");
      return;
    }
    setIsGeneratingShare(true);
    try {
      const file = await createPostcardFile(selectedShareNote, shareTemplateId);
      const template = getPostcardTemplate(shareTemplateId);
      const shareData = {
        title: `${SONG.title} · 音乐明信片`,
        text: `我给你寄来一张《${SONG.title}》${template.name}明信片`,
        files: [file],
      };
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share(shareData);
        setSheetMode(null);
      } else {
        const href = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = href;
        link.download = file.name;
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(href);
        setToast("已生成明信片图片");
      }
    } catch {
      setToast("已保留明信片选择");
    } finally {
      setIsGeneratingShare(false);
    }
  }

  function toggleLike() {
    const next = !liked;
    setLiked(next);
    window.localStorage.setItem(LIKE_KEY, String(next));
    setToast(next ? "已收藏这首歌" : "已取消收藏");
  }

  return (
    <main className="player-page">
      <audio
        ref={audioRef}
        src={SONG.audio}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="ambient-glow ambient-one" aria-hidden="true" />
      <div className="ambient-glow ambient-two" aria-hidden="true" />

      <section className="player-shell" aria-label={`${SONG.title} 音乐播放器`}>
        <header className="topbar">
          <button type="button" className="round-button" aria-label="收起播放器">
            <ChevronDown size={25} />
          </button>
          <div className="song-heading">
            <span className="eyebrow">寄声 · Postcard FM</span>
            <h1>{SONG.title}</h1>
            <p>{SONG.artist}</p>
          </div>
          <button type="button" className="round-button" aria-label="收藏到歌单">
            <Bookmark size={22} />
          </button>
        </header>

        <div className="postcard-stage">
          <Postcard
            note={displayedNote}
            isPeak={isPeak || showEgg}
            onCoverTap={handleCoverTap}
            onOpenNote={() => {
              if (displayedNote) selectHistoryNote(displayedNote);
            }}
            onCloseNote={() => {
              if (displayedNote) setDismissedNoteId(displayedNote.id);
            }}
          />
          <nav className="action-rail" aria-label="歌曲操作">
            <ActionButton label="分享" onClick={openShareSheet}>
              <Share2 size={22} />
            </ActionButton>
            <ActionButton label="喜欢" active={liked} onClick={toggleLike}>
              <Heart size={23} fill={liked ? "currentColor" : "none"} />
            </ActionButton>
          </nav>
        </div>

        <section className="lyric-panel" aria-label="滚动歌词">
          {isSharedVisit ? (
            <div className="share-invite" role="status">
              <span className="share-invite-eyebrow">来自一张寄来的明信片</span>
              <p>看到 ta 在这句歌词写下的话，你也想寄一张吗？</p>
              <button type="button" className="share-invite-cta" onClick={openComposer}>
                <Pencil size={14} />
                写下此刻
              </button>
            </div>
          ) : null}
          <div className="lyric-kicker">
            <span>{LYRICS[Math.max(0, lyricIndex - 1)].text}</span>
            <button
              className="paper-indicator"
              type="button"
              onClick={() => setSheetMode("history")}
              aria-label="查看这首歌的明信片"
            />
          </div>
          <div className="current-lyric-row">
            <h2>{currentLyric.text}</h2>
            <button type="button" onClick={openComposer}>
              <Pencil size={16} />
              {currentMomentNote ? "查看此刻" : "写下此刻"}
            </button>
          </div>
          <p className="next-lyric">{nextLyric.text}</p>
        </section>

        <section className="controls" aria-label="播放控制">
          <div className="progress-wrap">
            <input
              className="progress-slider"
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={Math.min(currentTime, duration)}
              style={{ "--progress": `${progress}%` } as React.CSSProperties}
              onChange={(event) => seekTo(Number(event.target.value))}
              aria-label="播放进度"
            />
            <div className="time-row">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="transport">
            <button
              type="button"
              className="transport-button"
              onClick={() => {
                seekTo(0);
                setToast("已回到歌曲开头");
              }}
              aria-label="上一首"
            >
              <SkipBack size={25} fill="currentColor" />
            </button>
            <button
              type="button"
              className="play-button"
              onClick={togglePlayback}
              aria-label={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? (
                <Pause size={33} fill="currentColor" />
              ) : (
                <Play size={33} fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              className="transport-button"
              onClick={() => seekTo(nextLyric.time, isPlaying)}
              aria-label="下一首"
            >
              <SkipForward size={25} fill="currentColor" />
            </button>
          </div>

          <div className="secondary-controls">
            <button
              type="button"
              onClick={() => {
                seekTo(Math.max(0, currentTime - 10), isPlaying);
                setToast("已回退 10 秒");
              }}
              aria-label="回退10秒"
            >
              <RotateCcw size={21} />
            </button>
            <button type="button" onClick={() => setSheetMode("comments")}>
              <MessageCircle size={19} />
              <span>94 评论</span>
            </button>
            <button type="button" onClick={() => setSheetMode("history")}>
              <ListMusic size={22} />
              <span className="sr-only">明信片列表</span>
            </button>
          </div>
        </section>
      </section>

      {composerMoment ? (
        <NoteComposer
          lyric={composerMoment.lyric}
          time={composerMoment.time}
          onCancel={() => setComposerMoment(null)}
          onSave={saveNote}
        />
      ) : null}

      {sheetMode ? (
        <BottomSheet
          mode={sheetMode}
          notes={notes}
          selectedShareNoteId={selectedShareNoteId}
          shareTemplateId={shareTemplateId}
          sharePreviewUrl={sharePreviewUrl}
          isGeneratingShare={isGeneratingShare}
          onClose={() => {
            setSheetMode(null);
            setSharePreviewUrl("");
          }}
          onSelectNote={selectHistoryNote}
          onDeleteNote={deleteNote}
          onSelectShareNote={selectShareNote}
          onSelectShareTemplate={selectShareTemplate}
          onShare={shareCurrentNote}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}
