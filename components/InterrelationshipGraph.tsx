import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';
import { getCategoryColorHex } from './FactorInput';

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

    // USE INITIAL REACHABILITY MATRIX to show ALL defined connections (SSIM inputs)
    const { initialReachabilityMatrix } = result;
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

    // --- Marker Positioning Logic ---
    // We use markerUnits="userSpaceOnUse" for precise pixel control.
    // Node Radius = 24.
    // Buffer = 5 (gap between node and arrow tip).
    // Arrow Tip Distance from Center = 29.
    
    const arrowDist = nodeRadius + 5;

    // 1. END Marker (Points Forward >)
    // Path: 0,-5 L10,0 L0,5 (Tip at 10)
    // We want Tip (10) to be at `Center - 29`.
    // refX anchors to Center.
    // So 10 - refX = -29  =>  refX = 39.
    const refXEnd = 10 + arrowDist;

    // 2. START Marker (Points Backward <)
    // Path: 10,-5 L0,0 L10,5 (Tip at 0)
    // We want Tip (0) to be at `Center + 29` (Start of line).
    // refX anchors to Center.
    // So 0 - refX = 29 => refX = -29.
    const refXStart = -arrowDist;

    const defs = svg.append("defs");

    // Standard End Arrow (Grey)
    defs.append("marker")
      .attr("id", "arrowhead-end-grey")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", refXEnd) 
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    // Mutual End Arrow (Purple)
    defs.append("marker")
      .attr("id", "arrowhead-end-purple")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", refXEnd)
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#8b5cf6");

    // Mutual Start Arrow (Purple) - Points "Back" relative to tangent
    // Note: orient="auto" aligns X-axis with tangent A->B.
    // We define arrow pointing LEFT (<) in marker space.
    defs.append("marker")
      .attr("id", "arrowhead-start-purple")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", refXStart)
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M10,-5L0,0L10,5") // Points Left
      .attr("fill", "#8b5cf6");

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

    // Process Links - Deduplicate Mutuals
    const links: any[] = [];
    const processedMutuals = new Set<string>();

    for(let i=0; i<initialReachabilityMatrix.length; i++) {
        for(let j=0; j<initialReachabilityMatrix.length; j++) {
            if(initialReachabilityMatrix[i][j] === 1 && i !== j) {
                const isMutual = initialReachabilityMatrix[j][i] === 1;
                
                if (isMutual) {
                    // Unique key for the pair to avoid adding A-B and B-A separately
                    const key = [Math.min(i, j), Math.max(i, j)].join('-');
                    if (!processedMutuals.has(key)) {
                        links.push({ 
                            source: nodes[i], 
                            target: nodes[j],
                            type: 'mutual' 
                        });
                        processedMutuals.add(key);
                    }
                } else {
                    links.push({ 
                        source: nodes[i], 
                        target: nodes[j],
                        type: 'direct' 
                    });
                }
            }
        }
    }

    // Draw Links
    svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("d", (d: any) => {
            // Straight line for everything
            return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        })
        .attr("fill", "none")
        .attr("stroke", (d:any) => d.type === 'mutual' ? "#8b5cf6" : "#94a3b8")
        .attr("stroke-width", (d:any) => d.type === 'mutual' ? 2.5 : 1.5)
        .attr("marker-end", (d:any) => d.type === 'mutual' ? "url(#arrowhead-end-purple)" : "url(#arrowhead-end-grey)")
        .attr("marker-start", (d:any) => d.type === 'mutual' ? "url(#arrowhead-start-purple)" : null)
        .attr("opacity", (d:any) => d.type === 'mutual' ? 1 : 0.6);

    // Draw Nodes
    const nodeGroups = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

    nodeGroups.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", "white")
        .attr("stroke", (d: any) => getCategoryColorHex(d.data.category))
        .attr("stroke-width", 3)
        .attr("cursor", "pointer")
        .on("mouseover", function() { d3.select(this).attr("fill", "#f1f5f9"); })
        .on("mouseout", function() { d3.select(this).attr("fill", "white"); });

    nodeGroups.append("text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text((d) => d.data.name)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
        .attr("fill", "#1e293b")
        .style("pointer-events", "none");

  }, [result, factors]);

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden">
        <svg id="interrelationship-graph-svg" ref={svgRef} className="block mx-auto"></svg>
        <div className="p-4 text-center text-sm text-slate-500 font-sans">
            Interrelationships between factors (Digraph). Nodes colored by category.
            <div className="flex justify-center gap-6 mt-2 text-xs font-medium">
                <span className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-slate-400 relative">
                        <span className="absolute right-0 -top-1 border-l-4 border-l-slate-400 border-t-4 border-t-transparent border-b-4 border-b-transparent"></span>
                    </span> 
                    One-way (Direct)
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-purple-500 relative">
                        <span className="absolute -left-1 -top-1 border-r-4 border-r-purple-500 border-t-4 border-t-transparent border-b-4 border-b-transparent"></span>
                        <span className="absolute -right-1 -top-1 border-l-4 border-l-purple-500 border-t-4 border-t-transparent border-b-4 border-b-transparent"></span>
                    </span> 
                    Two-way (Mutual)
                </span>
            </div>
        </div>
    </div>
  );
};

export default InterrelationshipGraph;