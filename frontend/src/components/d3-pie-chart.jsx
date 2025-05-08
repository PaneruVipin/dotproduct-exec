
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export function D3PieChart({ 
  data, 
  width = 300, 
  height = 300, 
  outerRadiusRatio = 0.8, 
  innerRadiusRatio = 0.5, 
  totalLabel = "Total", 
  totalValue = 0 
}) {
  const ref = useRef();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  useEffect(() => {
    if (data && data.length > 0) {
      const svg = d3.select(ref.current)
        .attr("width", width)
        .attr("height", height)
        .html(""); // Clear previous renders

      const radius = Math.min(width, height) / 2;
      const outerRadius = radius * outerRadiusRatio;
      const innerRadius = radius * innerRadiusRatio;

      const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

      const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);
      
      const tooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip absolute z-10 p-2 text-xs bg-popover text-popover-foreground border rounded-md shadow-lg pointer-events-none opacity-0 transition-opacity duration-200")
        .style("opacity", 0);

      const paths = g.selectAll("path")
        .data(pie(data))
        .enter().append("path")
        .attr("d", arc)
        .attr("fill", d => d.data.fill)
        .attr("stroke", "hsl(var(--background))") 
        .style("stroke-width", "2px")
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).style("opacity", 0.85);
          tooltip.transition().duration(200).style("opacity", .9);
          tooltip.html(`<strong>${d.data.name}</strong><br/>${formatCurrency(d.data.value)}`)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", (event, d) => {
          d3.select(event.currentTarget).style("opacity", 1);
          tooltip.transition().duration(500).style("opacity", 0);
        });
      
      // Center Label
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.25em")
        .style("font-size", "1.5rem") // Equivalent to text-2xl
        .style("font-weight", "bold")
        .attr("fill", "hsl(var(--foreground))")
        .text(formatCurrency(totalValue));

      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1em")
        .style("font-size", "0.875rem") // Equivalent to text-sm
        .attr("fill", "hsl(var(--muted-foreground))")
        .text(totalLabel);

      return () => {
        tooltip.remove();
      };

    } else {
      const svg = d3.select(ref.current)
        .attr("width", width)
        .attr("height", height)
        .html(""); // Clear previous renders

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "hsl(var(--muted-foreground))")
        .text("No data available for chart.");
    }
  }, [data, width, height, outerRadiusRatio, innerRadiusRatio, totalLabel, totalValue]);

  return <svg ref={ref} />;
}
