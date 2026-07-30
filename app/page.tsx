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
  id: "slowly-like-you",
  title: "慢慢喜欢你",
  artist: "莫文蔚",
  audio:
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  postcardDate: "2026. 07. 29",
};

const INITIAL_TIME = 18;
const FALLBACK_DURATION = 221;
const STORAGE_KEY = `postcard-notes:${SONG.id}`;
const LIKE_KEY = `postcard-liked:${SONG.id}`;

const LYRICS = [
  { time: 0, text: "书里总爱写到喜出望外的傍晚" },
  { time: 7.5, text: "骑的单车还有他和她的对白" },
  { time: 14.5, text: "有些瞬间，只想留给未来的自己" },
  { time: 23, text: "慢慢喜欢你，慢慢地亲密" },
  { time: 31.5, text: "慢慢聊自己，慢慢和你走在一起" },
  { time: 40, text: "晚风把今天折成一封轻轻的信" },
  { time: 49, text: "沿着旧街，一盏一盏路灯亮起" },
  { time: 58, text: "我把没说完的话藏进旋律" },
  { time: 68, text: "等下一次相遇，再慢慢说给你听" },
  { time: 78, text: "日子很长，心事可以慢一点抵达" },
  { time: 89, text: "我们交换眼神，也交换盛夏" },
  { time: 101, text: "原来喜欢，是把时间过成柔软的花" },
  { time: 113, text: "慢慢喜欢你，慢慢记住你" },
  { time: 125, text: "慢慢把每个寻常，都写成惊喜" },
  { time: 138, text: "如果多年以后又听见这一句" },
  { time: 151, text: "愿今天的心动，还会回到你手里" },
  { time: 164, text: "风从窗边经过，替我翻开回忆" },
  { time: 177, text: "每一张纸条，都有自己的归期" },
  { time: 190, text: "慢慢喜欢你，慢慢靠近你" },
  { time: 203, text: "把此刻的温柔，寄给未来的自己" },
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

const DEMO_NOTE: MemoryNote = {
  id: "demo-wind-home",
  songId: SONG.id,
  time: INITIAL_TIME,
  lyric: LYRICS[2].text,
  content: "那天回家的风很轻。",
  createdAt: "2025-10-17T20:30:00.000Z",
  source: "local",
};

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
        {/* The image is local and intentionally bypasses the worker image
            optimizer so the Vite preview also works offline. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/postcard-daisies.jpg"
          alt="夕阳下海边盛开的白色雏菊"
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
        摄影素材来自 Silvia Fang / Unsplash
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
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTriggeredRef = useRef<string | null>(null);
  const shareSeekRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(INITIAL_TIME);
  const [duration, setDuration] = useState(FALLBACK_DURATION);
  const [notes, setNotes] = useState<MemoryNote[]>([DEMO_NOTE]);
  const [visibleNote, setVisibleNote] = useState<MemoryNote | null>(DEMO_NOTE);
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
  const progress = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  const showNote = useCallback((note: MemoryNote) => {
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    setVisibleNote(note);
    noteTimerRef.current = setTimeout(() => setVisibleNote(null), 4000);
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([DEMO_NOTE]));
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
      if (savedNotes) setNotes(savedNotes);
      setLiked(savedLiked);
      if (sharedTime !== null) setCurrentTime(sharedTime);
      if (sharedNote) showNote(sharedNote);
      else noteTimerRef.current = setTimeout(() => setVisibleNote(null), 4000);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
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
      const nearby = notes.find((note) => Math.abs(note.time - target) <= 0.8);
      if (nearby) showNote(nearby);
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    const nearby = notes.find(
      (note) => Math.abs(note.time - audio.currentTime) <= 0.8,
    );
    if (nearby && lastTriggeredRef.current !== nearby.id) {
      lastTriggeredRef.current = nearby.id;
      showNote(nearby);
    } else if (!nearby) {
      lastTriggeredRef.current = null;
    }
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
    if (visibleNote?.id === note.id) setVisibleNote(null);
    setToast("纸条已移除");
  }

  async function shareMoment() {
    const selectedNote = currentMomentNote ?? visibleNote;
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
            {visibleNote ? (
              <FloatingNote
                note={visibleNote}
                onOpen={() => selectHistoryNote(visibleNote)}
                onClose={() => setVisibleNote(null)}
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
            <div className="note-markers" aria-hidden="true">
              {notes.map((note) => (
                <span
                  key={note.id}
                  style={{ left: `${Math.min(100, (note.time / duration) * 100)}%` }}
                />
              ))}
            </div>
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
