import Image from "next/image"

interface VisualSectionProps {
  imageUrl: string
  caption?: string
}

export function VisualSection({ imageUrl, caption }: VisualSectionProps) {
  return (
    <section className="relative bg-background">
      <div className="relative aspect-[21/9] w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt="Campaign visual"
          fill
          className="object-cover"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        
        {/* Caption */}
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <p className="max-w-2xl text-lg font-medium text-background md:text-2xl">
              {caption}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
