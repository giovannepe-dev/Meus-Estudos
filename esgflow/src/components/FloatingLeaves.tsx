import { Leaf } from "lucide-react";

const FloatingLeaves = () => {
  const leaves = [
    { top: "10%", left: "5%", size: 24, delay: "0s", className: "leaf-1" },
    { top: "20%", right: "10%", size: 20, delay: "2s", className: "leaf-2" },
    { top: "40%", left: "15%", size: 18, delay: "4s", className: "leaf-3" },
    { top: "60%", right: "20%", size: 22, delay: "1s", className: "leaf-1" },
    { top: "75%", left: "8%", size: 16, delay: "3s", className: "leaf-2" },
    { top: "30%", right: "5%", size: 28, delay: "5s", className: "leaf-3" },
    { top: "50%", left: "25%", size: 14, delay: "6s", className: "leaf-1" },
    { top: "85%", right: "15%", size: 20, delay: "2s", className: "leaf-2" },
    { top: "15%", left: "40%", size: 16, delay: "7s", className: "leaf-3" },
    { top: "70%", right: "35%", size: 18, delay: "4s", className: "leaf-1" },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {leaves.map((leaf, i) => (
        <div
          key={i}
          className={`absolute ${leaf.className} opacity-20`}
          style={{
            top: leaf.top,
            left: leaf.left,
            right: leaf.right,
            animationDelay: leaf.delay,
          }}
        >
          <Leaf size={leaf.size} className="text-primary" />
        </div>
      ))}
    </div>
  );
};

export default FloatingLeaves;
