type BrandMarkProps = {
  size?: number
  className?: string
}

export default function BrandMark({ size = 32, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect width="100" height="100" rx="20" fill="#111111" />
      <line x1="33.5" y1="22" x2="33.5" y2="78" stroke="#FAF9F6" strokeWidth="9" strokeLinecap="round" />
      <path
        d="M 33.5,22 Q 70,22 70,36 Q 70,50 33.5,50"
        stroke="#FAF9F6"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="51.5" y1="50" x2="67" y2="78" stroke="#C4782B" strokeWidth="9" strokeLinecap="round" />
    </svg>
  )
}
