"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Clock,
  GraduationCap,
  Calculator,
  Shapes,
  History,
  Globe,
  Users,
  Newspaper,
} from "lucide-react";

import { apiRequest } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Subject {
  id: string;
  name: string;
  examTypeId: string;
}

interface QuestionType {
  id: string;
  name: string;
  subjectId: string;
  totalQuestions?: number;
  completedVideos?: number;
}

interface Video {
  id: string;
  title: string;
  duration: number;
  thumbnailUrl?: string;
  youtubeUrl?: string;
  videoUrl?: string;
  order: number;
  isCompleted?: boolean;
  progress?: number;
}

interface VideoProgress {
  videoId: string;
  progress: number;
  isCompleted: boolean;
}

type View = "subjects" | "questionTypes" | "videos";

// ─── Subject Icons & Teacher Names ───────────────────────────────────────────

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  Türkçe: <BookOpen className="size-6" />,
  Matematik: <Calculator className="size-6" />,
  Geometri: <Shapes className="size-6" />,
  Tarih: <History className="size-6" />,
  Coğrafya: <Globe className="size-6" />,
  Vatandaşlık: <Users className="size-6" />,
  Güncel: <Newspaper className="size-6" />,
};

const SUBJECT_TEACHERS: Record<string, string> = {
  Türkçe: "Kaşgarlı Mahmud",
  Matematik: "Harezmi",
  Geometri: "Ömer Hayyam",
  Tarih: "İbn-i Haldun",
  Coğrafya: "Biruni",
  Vatandaşlık: "Celaleddin Ökten",
  Güncel: "Piri Reis",
};

// ─── API Functions ───────────────────────────────────────────────────────────

async function getSubjects(examTypeId: string): Promise<Subject[]> {
  return apiRequest<Subject[]>(`/exam-types/${examTypeId}/subjects`);
}

async function getQuestionTypes(subjectId: string): Promise<QuestionType[]> {
  return apiRequest<QuestionType[]>(`/subjects/${subjectId}/question-types`);
}

async function getVideos(questionTypeId: string): Promise<Video[]> {
  return apiRequest<Video[]>(`/videos?questionTypeId=${questionTypeId}`);
}

async function getVideoProgresses(): Promise<VideoProgress[]> {
  return apiRequest<VideoProgress[]>("/videos/progress");
}

async function saveVideoProgress(
  videoId: string,
  progress: number,
): Promise<void> {
  await apiRequest<void>(`/videos/${videoId}/progress`, {
    method: "POST",
    body: JSON.stringify({ progress }),
  });
}

// ─── Subject List View ───────────────────────────────────────────────────────

function SubjectList({
  subjects,
  onSelect,
}: {
  subjects: Subject[];
  onSelect: (subject: Subject) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject) => (
        <Card
          key={subject.id}
          className="exam-card border-border/70 cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/40"
          onClick={() => onSelect(subject)}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-2xl">
                {SUBJECT_ICONS[subject.name] || <BookOpen className="size-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{subject.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {SUBJECT_TEACHERS[subject.name] || "Uzman Eğitmen"}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <GraduationCap className="size-4 text-accent" />
                  <span className="text-xs text-muted-foreground">
                    Video Dersler
                  </span>
                </div>
              </div>
              <ChevronRight className="text-muted-foreground size-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Question Type List View ─────────────────────────────────────────────────

function QuestionTypeList({
  subject,
  questionTypes,
  onBack,
  onSelect,
}: {
  subject: Subject;
  questionTypes: QuestionType[];
  onBack: () => void;
  onSelect: (qt: QuestionType) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{subject.name}</h2>
          <p className="text-muted-foreground text-sm">
            Soru tipi seçerek video derslere erişin
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {questionTypes.map((qt) => (
          <Card
            key={qt.id}
            className="exam-card border-border/70 cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/40"
            onClick={() => onSelect(qt)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{qt.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{qt.totalQuestions || 0} soru</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="size-3.5 text-emerald-400" />
                      {qt.completedVideos || 0} video tamamlandı
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Video Player Modal ──────────────────────────────────────────────────────

function VideoPlayerModal({
  video,
  isOpen,
  onClose,
  onComplete,
  onNext,
  hasNext,
}: {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (progress: number) => void;
  onNext: () => void;
  hasNext: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (video) {
      setProgress(video.progress || 0);
    }
  }, [video]);

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const vid = e.currentTarget;
      const currentProgress = (vid.currentTime / vid.duration) * 100;
      setProgress(currentProgress);

      if (currentProgress >= 90 && !video?.isCompleted) {
        onComplete(100);
      }
    },
    [video, onComplete],
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  if (!video) return null;

  const isYouTube = video.youtubeUrl?.includes("youtube.com") || video.youtubeUrl?.includes("youtu.be");
  let embedUrl = "";
  
  if (isYouTube && video.youtubeUrl) {
    const videoId = video.youtubeUrl.includes("v=")
      ? video.youtubeUrl.split("v=")[1]?.split("&")[0]
      : video.youtubeUrl.split("youtu.be/")[1];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-lg pr-8">{video.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 p-4">
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
            {isYouTube ? (
              <iframe
                src={embedUrl}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : video.videoUrl ? (
              <video
                src={video.videoUrl}
                className="w-full h-full"
                controls
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <Play className="size-16 mx-auto mb-4 opacity-50" />
                  <p>Video yüklenemedi</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">İlerleme</span>
              <span className="font-medium">%{Math.round(progress)}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              <span>{formatDuration(video.duration)}</span>
              {video.isCompleted && (
                <Badge className="bg-emerald-500/20 text-emerald-400 ml-2">
                  <CheckCircle className="size-3 mr-1" />
                  Tamamlandı
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Kapat
              </Button>
              {hasNext && (
                <Button onClick={onNext} className="bg-primary hover:bg-primary/90">
                  Sonraki Video
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Video List View ─────────────────────────────────────────────────────────

function VideoList({
  questionType,
  videos,
  onBack,
}: {
  questionType: QuestionType;
  videos: Video[];
  onBack: () => void;
}) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoList, setVideoList] = useState<Video[]>(videos);

  const sortedVideos = [...videoList].sort((a, b) => a.order - b.order);

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  const handleVideoComplete = async (progress: number) => {
    if (!selectedVideo) return;

    try {
      await saveVideoProgress(selectedVideo.id, progress);
      setVideoList((prev) =>
        prev.map((v) =>
          v.id === selectedVideo.id
            ? { ...v, isCompleted: true, progress: 100 }
            : v,
        ),
      );
      toast.success("İlerleme kaydedildi");
    } catch {
      // Silent fail
    }
  };

  const handleNextVideo = () => {
    if (!selectedVideo) return;
    const currentIndex = sortedVideos.findIndex((v) => v.id === selectedVideo.id);
    const nextVideo = sortedVideos[currentIndex + 1];
    if (nextVideo) {
      setSelectedVideo(nextVideo);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const currentIndex = selectedVideo
    ? sortedVideos.findIndex((v) => v.id === selectedVideo.id)
    : -1;
  const hasNext = currentIndex >= 0 && currentIndex < sortedVideos.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{questionType.name}</h2>
          <p className="text-muted-foreground text-sm">
            {sortedVideos.length} video ders
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedVideos.map((video, index) => (
          <Card
            key={video.id}
            className={`exam-card border-border/70 cursor-pointer transition-all hover:border-primary/40 ${
              video.isCompleted ? "border-emerald-500/30" : ""
            }`}
            onClick={() => handleVideoClick(video)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Thumbnail / Play Button */}
                <div className="relative shrink-0">
                  <div className="bg-secondary flex size-20 items-center justify-center rounded-xl overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Play className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      #{index + 1}
                    </span>
                    <h3 className="font-medium truncate">{video.title}</h3>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2">
                    {video.isCompleted ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400">
                        <CheckCircle className="size-3 mr-1" />
                        Tamamlandı
                      </Badge>
                    ) : video.progress && video.progress > 0 ? (
                      <Badge variant="outline">
                        %{Math.round(video.progress)} izlendi
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        İzlenmedi
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="hidden sm:block">
                  {video.isCompleted ? (
                    <CheckCircle className="size-6 text-emerald-400" />
                  ) : (
                    <ChevronRight className="size-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {(video.progress || 0) > 0 && (
                <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      video.isCompleted ? "bg-emerald-400" : "bg-primary"
                    }`}
                    style={{ width: `${video.progress}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <VideoPlayerModal
        video={selectedVideo}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onComplete={handleVideoComplete}
        onNext={handleNextVideo}
        hasNext={hasNext}
      />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const [view, setView] = useState<View>("subjects");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Load subjects on mount
  useEffect(() => {
    async function loadSubjects() {
      try {
        // KPSS exam type id - in production this should come from user context
        const examTypeId = "kpss";
        const data = await getSubjects(examTypeId);
        setSubjects(data);
      } catch (err) {
        toast.error("Dersler yüklenemedi");
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  const handleSubjectSelect = async (subject: Subject) => {
    setSelectedSubject(subject);
    setLoading(true);
    try {
      const [qtypes, progresses] = await Promise.all([
        getQuestionTypes(subject.id),
        getVideoProgresses().catch(() => [] as VideoProgress[]),
      ]);
      
      // Enrich question types with video progress data
      const enriched = qtypes.map((qt) => ({
        ...qt,
        completedVideos: 0, // Will be calculated from API
      }));
      
      setQuestionTypes(enriched);
      setView("questionTypes");
    } catch {
      toast.error("Soru tipleri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionTypeSelect = async (qt: QuestionType) => {
    setSelectedQuestionType(qt);
    setLoading(true);
    try {
      const [videoData, progresses] = await Promise.all([
        getVideos(qt.id),
        getVideoProgresses().catch(() => [] as VideoProgress[]),
      ]);

      // Merge video data with progress
      const enrichedVideos = videoData.map((v) => {
        const progress = progresses.find((p) => p.videoId === v.id);
        return {
          ...v,
          isCompleted: progress?.isCompleted || false,
          progress: progress?.progress || 0,
        };
      });

      setVideos(enrichedVideos);
      setView("videos");
    } catch {
      toast.error("Videolar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSubjects = () => {
    setView("subjects");
    setSelectedSubject(null);
    setQuestionTypes([]);
  };

  const handleBackToQuestionTypes = () => {
    setView("questionTypes");
    setSelectedQuestionType(null);
    setVideos([]);
  };

  if (loading && view === "subjects") {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Oda"
          title="Öğretmenler Odası"
          description="Uzman yönlendirmeleri, seçili içerikler ve çalışma stratejileri için ayrılan kontrollü alan."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="exam-card border-border/70 h-32 animate-pulse">
              <CardContent className="p-6" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {view === "subjects" && (
        <>
          <PageHeader
            eyebrow="Oda"
            title="Öğretmenler Odası"
            description="Uzman yönlendirmeleri, seçili içerikler ve çalışma stratejileri için ayrılan kontrollü alan."
            badge="Mentor zone"
          />
          <SubjectList subjects={subjects} onSelect={handleSubjectSelect} />
        </>
      )}

      {view === "questionTypes" && selectedSubject && (
        <QuestionTypeList
          subject={selectedSubject}
          questionTypes={questionTypes}
          onBack={handleBackToSubjects}
          onSelect={handleQuestionTypeSelect}
        />
      )}

      {view === "videos" && selectedQuestionType && (
        <VideoList
          questionType={selectedQuestionType}
          videos={videos}
          onBack={handleBackToQuestionTypes}
        />
      )}
    </div>
  );
}
