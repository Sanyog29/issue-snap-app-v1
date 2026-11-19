interface SurveyFrameProps {
  className?: string;
  children?: React.ReactNode;
}

export function SurveyFrame({ className = '', children }: SurveyFrameProps) {
  return (
    <div className={`relative overflow-hidden rounded-photo ${className}`}>
      {/* 4 Corner L-Brackets in primary deep sky blue */}
      <div className="absolute inset-2 pointer-events-none z-10">
        {/* Top Left */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-primary" />
        {/* Top Right */}
        <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-primary" />
        {/* Bottom Left */}
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-primary" />
        {/* Bottom Right */}
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-primary" />
      </div>
      {children}
    </div>
  );
}
