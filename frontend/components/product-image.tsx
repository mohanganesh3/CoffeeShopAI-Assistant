"use client"

import { useState, useEffect } from "react";

interface ProductImageProps {
  src?: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}

const ProductImage = ({ src, fallbackSrc, alt, ...props }: ProductImageProps) => {
  const genericFallback = "/placeholder.svg?height=200&width=300";
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setErrorCount(0);
  }, [src, fallbackSrc]);

  const handleError = () => {
    setErrorCount(count => count + 1);
    if (errorCount === 0) {
      // first error, src failed, try fallbackSrc
      setImgSrc(fallbackSrc);
    } else if (errorCount === 1) {
      // second error, fallbackSrc failed, try generic
      setImgSrc(genericFallback);
    }
    // else: do nothing, generic fallback failed, show broken image icon
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
};

export default ProductImage;
