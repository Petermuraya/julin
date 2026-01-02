import React, { PropsWithChildren, Children } from "react";
import Reveal from "./Reveal";

type StaggerProps = PropsWithChildren<{ stagger?: number }>; 

export default function Stagger({ children, stagger = 0.06 }: StaggerProps) {
  const items = Children.toArray(children);
  return (
    <>
      {items.map((child, i) => (
        <Reveal key={i} delay={i * stagger}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
