import { Apple, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SocialAuth() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        variant="outline"
        className="border-border/70 bg-secondary/55 h-11 justify-center rounded-2xl"
      >
        <Globe className="mr-2 size-4" />
        Google ile devam et
      </Button>
      <Button
        variant="outline"
        className="border-border/70 bg-secondary/55 h-11 justify-center rounded-2xl"
      >
        <Apple className="mr-2 size-4" />
        Apple ile devam et
      </Button>
    </div>
  );
}
