import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';
import { getCategoryColorHex } from './FactorInput';

interface Props {
  result: ISMResult;
  factors: ISMElement[];
}

const HierarchyGraph: React.FC<Props> = ({ result, factors }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result || !svgRef.current || !containerRef.current) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const { levels, initialReachabilityMatrix } = result;
    
    // Configuration for Boxes
    const boxWidth = 220;
    const boxHeight = 80;
    const hGap = 40; // Horizontal gap between boxes
    const vGap = 100; // Vertical gap between levels
    
    // Calculate canvas size
    const maxNodesInLevel = Math.max(...levels.map(l => l.elements.length));
    const requiredWidth = maxNodesInLevel * (boxWidth + hGap) + 100;
    const containerWidth = containerRef.current.clientWidth || 800;
    const width = Math.max(containerWidth, requiredWidth);
    const height = Math.max(600, levels.length * (boxHeight + vGap) + 100);

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#ffffff");

    // Define Arrowhead markers
    const defs = svg.append("defs");
    
    // 1. Arrowhead for Side Entry (Same Level)
    // RefX accounts for box half-width (110) + arrow length (10)
    defs.append("marker")
      .attr("id", "arrowhead-side")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", boxWidth / 2 + 10) 
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8");

    // 2. Arrowhead for Bottom Entry (Level Up)
    // RefX is small because the line stops exactly at the edge
    defs.append("marker")
      .attr("id", "arrowhead-bottom")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10) 
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8");

    const nodes: any[] = [];
    
    // Position Levels (Top-Down)
    levels.forEach((lvl, lvlIndex) => {
        const y = 50 + (lvlIndex * (boxHeight + vGap));
        const count = lvl.elements.length;
        
        // Center the level horizontally
        const totalLevelWidth = count * boxWidth + (count - 1) * hGap;
        const startX = (width - totalLevelWidth) / 2;

        lvl.elements.forEach((elIndex, i) => {
            nodes.push({
                id: elIndex,
                x: startX + i * (boxWidth + hGap),
                y: y,
                level: lvl.level,
                data: factors[elIndex]
            });
        });
    });

    // Prepare Link Data from Initial Reachability Matrix
    // Filter logic: Only Same-Level or One-Level-Up (Lower Level Index -> Higher Level Index in terms of geometry)
    // Note: levels are usually 1 (Top) to N (Bottom). 
    // Driving factor (Level N) -> Dependent factor (Level N-1).
    const links: any[] = [];
    const matrix = initialReachabilityMatrix;
    
    for(let i=0; i<matrix.length; i++) {
        for(let j=0; j<matrix.length; j++) {
            if(matrix[i][j] === 1 && i !== j) {
                const source = nodes.find(n => n.id === i);
                const target = nodes.find(n => n.id === j);
                if (source && target) {
                    // Logic: source.level (e.g. 5) -> target.level (e.g. 4)
                    // Difference should be 1 for adjacent level up.
                    // Or 0 for same level.
                    const levelDiff = source.level - target.level;

                    if (levelDiff === 0 || levelDiff === 1) {
                        links.push({ source, target, levelDiff });
                    }
                }
            }
        }
    }

    // Draw Links
    svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", (d: any) => {
            if (d.levelDiff === 0) {
                // Same Level: Straight line Center-to-Center
                const sx = d.source.x + boxWidth / 2;
                const sy = d.source.y + boxHeight / 2;
                const tx = d.target.x + boxWidth / 2;
                const ty = d.target.y + boxHeight / 2;
                return `M${sx},${sy}L${tx},${ty}`;
            } else {
                // Adjacent Level (Source Below Target)
                // Elbow: Source Top -> Target Bottom
                const startX = d.source.x + boxWidth / 2;
                const startY = d.source.y; // Top edge
                const endX = d.target.x + boxWidth / 2;
                const endY = d.target.y + boxHeight; // Bottom edge
                
                const midY = (startY + endY) / 2;
                
                return `M${startX},${startY}V${midY}H${endX}V${endY}`;
            }
        })
        .attr("fill", "none")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 2)
        .attr("marker-end", (d: any) => d.levelDiff === 0 ? "url(#arrowhead-side)" : "url(#arrowhead-bottom)");

    // Draw Nodes (Groups)
    const nodeGroups = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    // Box Rect
    nodeGroups.append("rect")
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .attr("rx", 6) // Rounded corners
        .attr("fill", "#ffffff")
        .attr("stroke", (d:any) => getCategoryColorHex(d.data.category))
        .attr("stroke-width", 2)
        .attr("filter", "drop-shadow(0px 4px 6px rgba(0,0,0,0.1))");

    // HTML Content via foreignObject for text wrapping
    nodeGroups.append("foreignObject")
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .append("xhtml:div")
        .style("width", "100%")
        .style("height", "100%")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("padding", "8px")
        .style("box-sizing", "border-box")
        .style("text-align", "center")
        .style("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
        .html((d: any) => `
          <div style="font-weight:bold; font-size:14px; color:#334155; margin-bottom:4px; line-height:1;">${d.data.name}</div>
          <div style="font-size:11px; line-height:1.3; color:#1e293b; overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical;">
            ${d.data.description || d.data.name}
          </div>
        `);

    // Level Labels
    const uniqueLevels = [...new Set(nodes.map((n:any) => n.level))].sort((a,b) => a-b);
    
    svg.selectAll(".level-label")
       .data(uniqueLevels)
       .enter()
       .append("text")
       .attr("x", 20)
       .attr("y", (d: any, i) => 50 + (i * (boxHeight + vGap)) + boxHeight/2)
       .text((d: any) => `Level ${d}`)
       .attr("fill", "#64748b")
       .attr("font-weight", "bold")
       .attr("font-size", "14px")
       .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
       .attr("alignment-baseline", "middle");

  }, [result, factors]);

  // Legend
  const legendData = React.useMemo(() => {
     const cats = Array.from(new Set(factors.map(f => f.category).filter(Boolean))) as string[];
     return cats.map(c => ({ label: c, color: getCategoryColorHex(c) }));
  }, [factors]);

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 shadow-inner overflow-x-auto overflow-y-hidden">
        <svg id="hierarchy-graph-svg" ref={svgRef} className="block min-w-[600px] mx-auto"></svg>
        <div className="p-4 border-t border-slate-100 flex flex-wrap gap-4 justify-center text-xs">
            {legendData.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 font-medium">{item.label}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

export default HierarchyGraph;