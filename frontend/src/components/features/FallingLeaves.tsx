import { useEffect, useRef } from 'react';

export default function FallingLeaves() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Tạo keyframes một lần duy nhất
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes fall {
        to {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);

    const leaves = ['🍂', '🍃', '🍁'];

    const createLeaf = () => {
      if (!container) return;

      const leaf = document.createElement('div');
      const randomLeaf = leaves[Math.floor(Math.random() * leaves.length)];
      const randomLeft = Math.random() * 100;
      const randomDuration = 8 + Math.random() * 6; // 8-14s
      const randomDelay = Math.random() * 3;
      const randomRotate = Math.random() * 360;

      leaf.innerHTML = randomLeaf;
      leaf.style.position = 'fixed';
      leaf.style.left = `${randomLeft}%`;
      leaf.style.top = '-50px';
      leaf.style.fontSize = `${1.5 + Math.random() * 2}rem`; // kích thước ngẫu nhiên
      leaf.style.opacity = '0.7';
      leaf.style.pointerEvents = 'none';
      leaf.style.zIndex = '10';
      leaf.style.transform = `rotate(${randomRotate}deg)`;
      leaf.style.animation = `fall ${randomDuration}s linear ${randomDelay}s forwards`;

      container.appendChild(leaf);

      // Tự động xóa sau khi rơi xong
      setTimeout(() => {
        if (leaf.parentNode) {
          leaf.remove();
        }
      }, (randomDuration + randomDelay + 1) * 1000); // +1s buffer
    };

    // Tạo lá rơi mỗi 400-800ms
    const intervalId = setInterval(() => {
      if (Math.random() > 0.3) { // ngẫu nhiên để không quá dày
        createLeaf();
      }
    }, 500);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      if (styleSheet.parentNode) {
        styleSheet.remove();
      }
      // Xóa hết lá còn lại khi unmount
      container.querySelectorAll('div').forEach((el) => el.remove());
    };
  }, []); // Chỉ chạy 1 lần khi mount

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-10" />;
}