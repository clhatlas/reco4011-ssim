import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';

interface Props {
  result: ISMResult;
  factors: ISMElement[];
}

const InterrelationshipGraph: React.FC<Props> = ({ result, factors }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result || !svgRef.current || !containerRef.current) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const { canonicalMatrix } = result;
    const width = containerRef.current.clientWidth || 800;
    const height = 600;
    const radius = Math.min(width, height) / 2 - 60; // Radius of the circle layout
    const nodeRadius = 24;
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#ffffff");

    // Define Arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead-circle")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", nodeRadius + 5)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    // Create Nodes in a Circle
    const nodes = factors.map((f, i) => {
        const angle = (i / factors.length) * 2 * Math.PI - Math.PI / 2; // Start from top
        return {
            id: i,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            data: f
        };
    });

    // Create Links from Canonical Matrix
    const links: any[] = [];
    for(let i=0; i<canonicalMatrix.length; i++) {
        for(let j=0; j<canonicalMatrix.length; j++) {
            if(canonicalMatrix[i][j] === 1 && i !== j) {
                links.push({ source: nodes[i], target: nodes[j] });
            }
        }
    }

    // Draw Links (Curved)
    svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("d", (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Controls curvature
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        })
        .attr("fill", "none")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1.5)
        .attr("marker-end", "url(#arrowhead-circle)")
        .attr("opacity", 0.6);

    // Draw Nodes
    const nodeGroups = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

    nodeGroups.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", "white")
        .attr("stroke", "#334155")
        .attr("stroke-width", 2);

    nodeGroups.append("text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text((d) => d.data.name)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "#1e293b");

  }, [result, factors]);

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden">
        <svg id="interrelationship-graph-svg" ref={svgRef} className="block mx-auto"></svg>
        <div className="p-4 text-center text-sm text-slate-500">
            Figure 4: Interrelationships between barriers (Digraph)
        </div>
    </div>
  );
};

export default InterrelationshipGraph;
