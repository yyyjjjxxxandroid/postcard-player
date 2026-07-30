"use client";

import {
  Bookmark,
  ChevronDown,
  Clock3,
  Headphones,
  Heart,
  ListMusic,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Send,
  Share2,
  SkipBack,
  SkipForward,
  Trash2,
  VolumeX,
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
  postcardDate: "传统民歌",
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
  { time: 17.8, text: "月亮弯弯" },
  { time: 21.6, text: "康定溜溜的城哟" },
  { time: 26.2, text: "李家溜溜的大姐" },
  { time: 31, text: "人才溜溜的好哟" },
  { time: 35.5, text: "张家溜溜的大哥" },
  { time: 40, text: "看上溜溜的她哟" },
  { time: 44.8, text: "月亮弯弯" },
  { time: 48.6, text: "看上溜溜的她哟" },
];

type Lyric = (typeof LYRICS)[number];

type MemoryNote = {
  id: string;
  songId: string;
  time: number;
  lyric: string;
  content: string;
  createdAt: string;
  source?: "local" | "shared";
};

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

function Postcard() {
  return (
    <figure className="postcard" aria-label="一张寄往未来的音乐明信片">
      <div className="postcard-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SONG.cover}
          alt="成方圆《康定情歌》专辑封面"
        />
      </div>
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
      <div className="postcard-copy">
        <span className="hand-date">{SONG.postcardDate}</span>
        <span className="hand-line" aria-hidden="true" />
        <p>把此刻的心动，寄给未来的自己。</p>
      </div>
      <figcaption className="sr-only">
        《康定情歌》为传统中文民歌
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
        aria-label={`跳转到 ${formatTime(note.time)} 的纸条`}
      >
        <span>{note.content}</span>
        <small>{formatNoteDate(note.createdAt)}</small>
      </button>
      <button
        className="note-close"
        type="button"
        aria-label="关闭纸条"
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
            <h2>留下这一秒的心情</h2>
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
            寄出纸条
          </button>
        </div>
      </form>
    </div>
  );
}

function BottomSheet({
  mode,
  notes,
  onClose,
  onSelectNote,
  onDeleteNote,
}: {
  mode: "history" | "comments";
  notes: MemoryNote[];
  onClose: () => void;
  onSelectNote: (note: MemoryNote) => void;
  onDeleteNote: (note: MemoryNote) => void;
}) {
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="bottom-sheet"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label={mode === "history" ? "纸条历史" : "歌曲评论"}
      >
        <div className="sheet-handle" />
        <header>
          <div>
            <span className="eyebrow">
              {mode === "history" ? "时光邮局" : "听友留言"}
            </span>
            <h2>{mode === "history" ? "这首歌里的纸条" : "94 条评论"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>

        {mode === "history" ? (
          <div className="history-list">
            {notes.length ? (
              [...notes]
                .sort((a, b) => a.time - b.time)
                .map((note) => (
                  <article className="history-item" key={note.id}>
                    <button type="button" onClick={() => onSelectNote(note)}>
                      <span className="history-time">{formatTime(note.time)}</span>
                      <strong>{note.content}</strong>
                      <small>{note.lyric}</small>
                    </button>
                    <button
                      className="delete-note"
                      type="button"
                      onClick={() => onDeleteNote(note)}
                      aria-label={`删除纸条：${note.content}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))
            ) : (
              <div className="empty-state">
                <Music2 size={24} />
                <p>还没有纸条。等某句歌词经过时，写下一点什么吧。</p>
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
  const [soundOn, setSoundOn] = useState(true);
  const [composerMoment, setComposerMoment] = useState<{
    time: number;
    lyric: string;
  } | null>(null);
  const [sheetMode, setSheetMode] = useState<"history" | "comments" | null>(
    null,
  );
  const [toast, setToast] = useState("");

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
      if (sharedNote) showNote(sharedNote);
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
    setToast("纸条已寄往未来");
  }

  function selectHistoryNote(note: MemoryNote) {
    setSheetMode(null);
    seekTo(note.time, true);
    showNote(note);
  }

  function deleteNote(note: MemoryNote) {
    persistNotes(notes.filter((item) => item.id !== note.id));
    if (displayedNote?.id === note.id) setDismissedNoteId(null);
    setToast("纸条已移除");
  }

  async function shareMoment() {
    const selectedNote = currentMomentNote ?? displayedNote;
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("song", SONG.id);
    url.searchParams.set("t", Math.round(currentTime).toString());
    if (selectedNote?.content) {
      url.searchParams.set("note", selectedNote.content);
    }
    const shareData = {
      title: `${SONG.title} · ${SONG.artist}`,
      text: selectedNote?.content
        ? `听到这里时，我写下：${selectedNote.content}`
        : `和我一起听 ${SONG.title}`,
      url: url.toString(),
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(url.toString());
        setToast("时间点链接已复制");
      }
    } catch {
      setToast("已保留当前时间点");
    }
  }

  function toggleLike() {
    const next = !liked;
    setLiked(next);
    window.localStorage.setItem(LIKE_KEY, String(next));
    setToast(next ? "已收藏这首歌" : "已取消收藏");
  }

  function toggleSound() {
    const audio = audioRef.current;
    const next = !soundOn;
    setSoundOn(next);
    if (audio) audio.muted = !next;
    setToast(next ? "声音已打开" : "已静音");
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
            <span className="eyebrow">正在播放</span>
            <h1>{SONG.title}</h1>
            <p>{SONG.artist}</p>
          </div>
          <button type="button" className="round-button" aria-label="收藏到歌单">
            <Bookmark size={22} />
          </button>
        </header>

        <div className="postcard-stage">
          <Postcard />
          <nav className="action-rail" aria-label="歌曲操作">
            <ActionButton label="音效" active={soundOn} onClick={toggleSound}>
              {soundOn ? <Headphones size={22} /> : <VolumeX size={22} />}
            </ActionButton>
            <ActionButton label="分享" onClick={shareMoment}>
              <Share2 size={22} />
            </ActionButton>
            <ActionButton label="喜欢" active={liked} onClick={toggleLike}>
              <Heart size={23} fill={liked ? "currentColor" : "none"} />
            </ActionButton>
            <ActionButton label="更多" onClick={() => setSheetMode("history")}>
              <MoreHorizontal size={24} />
            </ActionButton>
          </nav>
        </div>

        <section className="lyric-panel" aria-label="滚动歌词">
          <div className="lyric-kicker">
            <span>{LYRICS[Math.max(0, lyricIndex - 1)].text}</span>
            <span className="paper-indicator" aria-hidden="true" />
          </div>
          <div className="memory-layer">
            {displayedNote ? (
              <FloatingNote
                note={displayedNote}
                onOpen={() => selectHistoryNote(displayedNote)}
                onClose={() => {
                  setDismissedNoteId(displayedNote.id);
                }}
              />
            ) : (
              <span className="memory-placeholder">
                听到旧时光时，纸条会从这里回来
              </span>
            )}
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
              <span className="sr-only">纸条列表</span>
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
          onClose={() => setSheetMode(null)}
          onSelectNote={selectHistoryNote}
          onDeleteNote={deleteNote}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}
