import Image from "next/image"

interface VisualSectionProps {
  imageUrl: string
  caption?: string
}

function VisualImage({ src }: { src: string }) {
  const useNative =
    src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")
  if (useNative) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="Campaign visual" className="absolute inset-0 h-full w-full object-cover" />
    )
  }
  return <Image src={src} alt="Campaign visual" fill className="object-cover" />
}

export function VisualSection({ imageUrl, caption }: VisualSectionProps) {
  return (
    <section className="relative bg-background">
      <div className="relative aspect-[21/9] w-full overflow-hidden">
        <VisualImage src={imageUrl} />
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
