import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  BookOpen,
  Info,
  Check,
  Copy,
  FolderTree,
  Filter,
  X
} from 'lucide-react';
import { Lecture, MindmapConceptNode, ConceptCategory } from '../types';
import {
  generateMindmapFromLecture,
  flattenMindmap,
  getAllNodeIdsWithChildren,
  countTotalDescendants,
  findNodePath,
  searchMindmap
} from '../utils/mindmapGenerator';

interface LectureConceptMindmapProps {
  lecture: Lecture;
  onSelectLectureForQuiz?: (lecture: Lecture) => void;
  onSelectLectureForExaminer?: (topic: string) => void;
  className?: string;
  isFullscreenDefault?: boolean;
}

// Internal simulation types
interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  category: ConceptCategory;
  description?: string;
  examinerNote?: string;
  level: number;
  parentId?: string;
  childCount: number;
  totalDescendants: number;
  isCollapsed: boolean;
  radius: number;
  hasChildren: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  category?: ConceptCategory;
}

const CATEGORY_COLORS: Record<ConceptCategory, { fill: string; stroke: string; text: string; glow: string; bg: string }> = {
  root: {
    fill: '#f59e0b',
    stroke: '#fbbf24',
    text: '#ffffff',
    glow: 'rgba(245, 158, 11, 0.4)',
    bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
  },
  mechanism: {
    fill: '#f97316',
    stroke: '#fb923c',
    text: '#fed7aa',
    glow: 'rgba(249, 115, 22, 0.35)',
    bg: 'bg-orange-500/10 text-orange-300 border-orange-500/30'
  },
  trap: {
    fill: '#f43f5e',
    stroke: '#fb7185',
    text: '#fecdd3',
    glow: 'rgba(244, 63, 94, 0.35)',
    bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30'
  },
  analogy: {
    fill: '#06b6d4',
    stroke: '#22d3ee',
    text: '#cffafe',
    glow: 'rgba(6, 182, 212, 0.35)',
    bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
  },
  pearl: {
    fill: '#10b981',
    stroke: '#34d399',
    text: '#a7f3d0',
    glow: 'rgba(16, 185, 129, 0.35)',
    bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
  },
  detail: {
    fill: '#a855f7',
    stroke: '#c084fc',
    text: '#e9d5ff',
    glow: 'rgba(168, 85, 247, 0.35)',
    bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
  }
};

export const LectureConceptMindmap: React.FC<LectureConceptMindmapProps> = ({
  lecture,
  onSelectLectureForQuiz,
  onSelectLectureForExaminer,
  className = '',
  isFullscreenDefault = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Full hierarchical concept tree derived from lecture
  const rootNode = useMemo(() => generateMindmapFromLecture(lecture), [lecture]);

  // Information Density Preset: 'overview' | 'standard' | 'deep'
  const [densityPreset, setDensityPreset] = useState<'overview' | 'standard' | 'deep'>('standard');

  // Set of collapsed node IDs
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    // Default to 'standard': collapse level 2 items (hiding level 3 fine details)
    const initial = new Set<string>();
    function initWalk(node: MindmapConceptNode) {
      if (node.level === 2 && node.children && node.children.length > 0) {
        initial.add(node.id);
      }
      if (node.children) {
        node.children.forEach(initWalk);
      }
    }
    initWalk(rootNode);
    return initial;
  });

  // Selected node for Detail Inspector drawer
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-root');

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Canvas fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenDefault);

  // Copied alert feedback
  const [isCopied, setIsCopied] = useState(false);

  // Hovered node for tooltip
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Total count of all concepts in the lecture
  const totalConceptsCount = useMemo(() => {
    let count = 0;
    function walk(node: MindmapConceptNode) {
      count++;
      if (node.children) node.children.forEach(walk);
    }
    walk(rootNode);
    return count;
  }, [rootNode]);

  // Search results
  const searchResults = useMemo(() => {
    return searchMindmap(rootNode, searchQuery);
  }, [rootNode, searchQuery]);

  // If search query is non-empty, auto-expand ancestors of matching nodes
  useEffect(() => {
    if (searchQuery.trim() && searchResults.ancestorIdsToExpand.size > 0) {
      setCollapsedIds(prev => {
        let changed = false;
        const next = new Set(prev);
        for (const id of searchResults.ancestorIdsToExpand) {
          if (next.has(id)) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [searchQuery, searchResults]);

  // Calculate active flat nodes and links based on collapsed set
  const { nodes: flatNodes, links: flatLinks } = useMemo(() => {
    return flattenMindmap(rootNode, collapsedIds);
  }, [rootNode, collapsedIds]);

  // Density preset handlers
  const handleSetDensity = useCallback((preset: 'overview' | 'standard' | 'deep') => {
    setDensityPreset(preset);
    const newCollapsed = new Set<string>();

    function walk(node: MindmapConceptNode) {
      const hasKids = !!(node.children && node.children.length > 0);
      if (preset === 'overview') {
        // Collapse all level 1 pillars
        if (node.level === 1 && hasKids) {
          newCollapsed.add(node.id);
        }
      } else if (preset === 'standard') {
        // Collapse level 2 subtopics
        if (node.level === 2 && hasKids) {
          newCollapsed.add(node.id);
        }
      }
      // 'deep' leaves newCollapsed empty
      if (node.children) node.children.forEach(walk);
    }

    walk(rootNode);
    setCollapsedIds(newCollapsed);
  }, [rootNode]);

  // Toggle single node collapse
  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    setCollapsedIds(new Set());
    setDensityPreset('deep');
  }, []);

  // Collapse all expandable nodes except root
  const handleCollapseAll = useCallback(() => {
    const allCollapsible = new Set<string>();
    function walk(node: MindmapConceptNode) {
      if (node.level >= 1 && node.children && node.children.length > 0) {
        allCollapsible.add(node.id);
      }
      if (node.children) node.children.forEach(walk);
    }
    walk(rootNode);
    setCollapsedIds(allCollapsible);
    setDensityPreset('overview');
  }, [rootNode]);

  // Focus only selected branch: collapse all other branches outside target's path
  const handleFocusBranch = useCallback((targetId: string) => {
    const path = findNodePath(rootNode, targetId);
    if (!path) return;

    const pathIds = new Set(path.map(n => n.id));
    const newCollapsed = new Set<string>();

    function walk(node: MindmapConceptNode) {
      const hasKids = !!(node.children && node.children.length > 0);
      if (hasKids && !pathIds.has(node.id) && node.id !== targetId) {
        newCollapsed.add(node.id);
      }
      if (node.children) node.children.forEach(walk);
    }

    walk(rootNode);
    setCollapsedIds(newCollapsed);
  }, [rootNode]);

  // Reset / Fit Zoom
  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity.translate(0, 0).scale(1)
    );
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.77);
  }, []);

  // Node radius computation
  const getNodeRadius = (level: number): number => {
    switch (level) {
      case 0: return 28; // Root
      case 1: return 20; // Major Pillar
      case 2: return 14; // Sub-topic / Step
      case 3: return 9;  // Fine detail
      default: return 8;
    }
  };

  // Convert MindmapConceptNode to SimNode
  const simNodes: SimNode[] = useMemo(() => {
    return flatNodes.map(n => {
      const savedPos = nodePositionsRef.current.get(n.id);
      const isCollapsed = collapsedIds.has(n.id);
      const hasChildren = !!(n.children && n.children.length > 0);
      const childCount = n.children ? n.children.length : 0;
      const totalDescendants = countTotalDescendants(n);

      return {
        id: n.id,
        name: n.name,
        category: n.category,
        description: n.description,
        examinerNote: n.examinerNote,
        level: n.level,
        parentId: n.parentId,
        childCount,
        totalDescendants,
        isCollapsed,
        hasChildren,
        radius: getNodeRadius(n.level),
        x: savedPos ? savedPos.x : undefined,
        y: savedPos ? savedPos.y : undefined,
      };
    });
  }, [flatNodes, collapsedIds]);

  const simLinks: SimLink[] = useMemo(() => {
    return flatLinks.map(l => ({
      source: typeof l.source === 'string' ? l.source : (l.source as MindmapConceptNode).id,
      target: typeof l.target === 'string' ? l.target : (l.target as MindmapConceptNode).id,
      category: l.category,
    }));
  }, [flatLinks]);

  // Selected node metadata
  const selectedNode = useMemo(() => {
    let found: MindmapConceptNode | null = null;
    function walk(n: MindmapConceptNode) {
      if (n.id === selectedNodeId) found = n;
      if (n.children) n.children.forEach(walk);
    }
    walk(rootNode);
    return found || rootNode;
  }, [rootNode, selectedNodeId]);

  // Selected node breadcrumb path
  const selectedBreadcrumbs = useMemo(() => {
    return findNodePath(rootNode, selectedNodeId) || [rootNode];
  }, [rootNode, selectedNodeId]);

  // D3 FORCE SIMULATION RENDER
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 550;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Definitions (glow filters, gradients, markers)
    const defs = svg.append('defs');

    // Drop shadow glow filter
    const filter = defs.append('filter')
      .attr('id', 'concept-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Linear gradients for categories
    Object.entries(CATEGORY_COLORS).forEach(([cat, theme]) => {
      const grad = defs.append('radialGradient')
        .attr('id', `grad-${cat}`)
        .attr('cx', '35%')
        .attr('cy', '35%')
        .attr('r', '65%');

      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', theme.stroke)
        .attr('stop-opacity', 0.9);

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', theme.fill)
        .attr('stop-opacity', 0.95);
    });

    // Zoom container
    const g = svg.append('g').attr('class', 'mindmap-world');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Simulation Setup
    // Initialize unpositioned nodes near their parent or near center
    simNodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) {
        if (node.parentId && nodePositionsRef.current.has(node.parentId)) {
          const parentPos = nodePositionsRef.current.get(node.parentId)!;
          node.x = parentPos.x + (Math.random() - 0.5) * 40;
          node.y = parentPos.y + (Math.random() - 0.5) * 40;
        } else {
          node.x = width / 2 + (Math.random() - 0.5) * 60;
          node.y = height / 2 + (Math.random() - 0.5) * 60;
        }
      }
    });

    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3.forceLink<SimNode, SimLink>(simLinks)
          .id(d => d.id)
          .distance(d => {
            const tgt = d.target as SimNode;
            if (tgt.level === 1) return 150;
            if (tgt.level === 2) return 100;
            return 70;
          })
          .strength(0.65)
      )
      .force(
        'charge',
        d3.forceManyBody<SimNode>()
          .strength(d => {
            if (d.level === 0) return -900;
            if (d.level === 1) return -480;
            if (d.level === 2) return -260;
            return -140;
          })
          .distanceMax(600)
      )
      .force(
        'collide',
        d3.forceCollide<SimNode>()
          .radius(d => d.radius + 18)
          .iterations(2)
      )
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.04))
      .force('x', d3.forceX(width / 2).strength(0.035))
      .force('y', d3.forceY(height / 2).strength(0.035));

    simulationRef.current = simulation;

    // Links container
    const linkGroup = g.append('g').attr('class', 'links');
    const links = linkGroup
      .selectAll<SVGPathElement, SimLink>('path')
      .data(simLinks)
      .join('path')
      .attr('stroke', d => {
        const cat = d.category || 'root';
        return CATEGORY_COLORS[cat]?.stroke || '#64748b';
      })
      .attr('stroke-width', d => {
        const tgt = d.target as SimNode;
        if (tgt.level === 1) return 2.5;
        if (tgt.level === 2) return 1.8;
        return 1.2;
      })
      .attr('stroke-opacity', 0.45)
      .attr('stroke-dasharray', d => {
        const tgt = d.target as SimNode;
        return tgt.category === 'trap' ? '4,3' : 'none';
      })
      .attr('fill', 'none');

    // Nodes container
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeGroup
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes, d => d.id)
      .join('g')
      .attr('class', 'concept-node cursor-pointer')
      .call(
        d3.drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node outer selection / search / collapse aura
    nodeElements.append('circle')
      .attr('class', 'node-halo')
      .attr('r', d => d.radius + 6)
      .attr('fill', 'none')
      .attr('stroke', d => {
        if (searchResults.matchedNodeIds.has(d.id)) return '#fbbf24';
        if (d.id === selectedNodeId) return '#38bdf8';
        if (d.isCollapsed && d.hasChildren) return CATEGORY_COLORS[d.category].stroke;
        return 'transparent';
      })
      .attr('stroke-width', d => (searchResults.matchedNodeIds.has(d.id) || d.id === selectedNodeId ? 2.5 : d.isCollapsed ? 1.5 : 0))
      .attr('stroke-dasharray', d => (d.isCollapsed ? '3,2' : 'none'))
      .attr('opacity', 0.85);

    // Main Circle
    nodeElements.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => d.radius)
      .attr('fill', d => `url(#grad-${d.category})`)
      .attr('stroke', d => {
        if (searchResults.matchedNodeIds.has(d.id)) return '#f59e0b';
        if (d.id === selectedNodeId) return '#ffffff';
        return CATEGORY_COLORS[d.category].stroke;
      })
      .attr('stroke-width', d => (d.id === selectedNodeId ? 3 : 1.8))
      .style('filter', d => (d.id === selectedNodeId || searchResults.matchedNodeIds.has(d.id) ? 'url(#concept-glow)' : 'none'));

    // Collapsed Badge on Nodes with hidden children
    const badgeElements = nodeElements
      .filter(d => d.hasChildren)
      .append('g')
      .attr('class', 'collapse-badge')
      .attr('transform', d => `translate(${d.radius * 0.72}, ${-d.radius * 0.72})`);

    badgeElements.append('circle')
      .attr('r', 8)
      .attr('fill', d => (d.isCollapsed ? '#e11d48' : '#0f172a'))
      .attr('stroke', d => (d.isCollapsed ? '#fda4af' : '#64748b'))
      .attr('stroke-width', 1.2);

    badgeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#ffffff')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text(d => (d.isCollapsed ? `+${d.totalDescendants}` : '−'));

    // Text labels for Level 0, 1, and 2 nodes
    nodeElements
      .filter(d => d.level <= 2 || searchResults.matchedNodeIds.has(d.id))
      .append('text')
      .attr('dy', d => (d.level === 0 ? d.radius + 15 : d.radius + 13))
      .attr('text-anchor', 'middle')
      .attr('font-size', d => (d.level === 0 ? '13px' : d.level === 1 ? '11px' : '10px'))
      .attr('font-weight', d => (d.level === 0 ? '700' : d.level === 1 ? '600' : '500'))
      .attr('fill', d => {
        if (searchResults.matchedNodeIds.has(d.id)) return '#fde047';
        if (d.id === selectedNodeId) return '#ffffff';
        return '#cbd5e1';
      })
      .attr('paint-order', 'stroke')
      .attr('stroke', '#090d16')
      .attr('stroke-width', '3px')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .text(d => {
        const maxLen = d.level === 0 ? 32 : d.level === 1 ? 24 : 18;
        return d.name.length > maxLen ? d.name.slice(0, maxLen) + '…' : d.name;
      });

    // Node Click Handlers
    nodeElements.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNodeId(d.id);

      // If clicked on node with children, toggle collapse
      if (d.hasChildren) {
        handleToggleCollapse(d.id);
      }
    });

    // Double-click always selects without toggling
    nodeElements.on('dblclick', (event, d) => {
      event.stopPropagation();
      setSelectedNodeId(d.id);
    });

    // Hover tooltip handlers
    nodeElements
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      })
      .on('mousemove', (event) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Background click deselects
    svg.on('click', () => {
      // Keep root selected instead of null
    });

    // Simulation Tick Updates
    simulation.on('tick', () => {
      // Save positions for smooth preservation on subsequent render cycles
      simNodes.forEach(n => {
        if (n.x !== undefined && n.y !== undefined) {
          nodePositionsRef.current.set(n.id, { x: n.x, y: n.y });
        }
      });

      // Update curved links
      links.attr('d', d => {
        const s = d.source as SimNode;
        const t = d.target as SimNode;
        if (!s.x || !s.y || !t.x || !t.y) return '';

        // Smooth curved bezier linking
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.25;
        return `M${s.x},${s.y}A${dr},${dr} 0 0,1 ${t.x},${t.y}`;
      });

      // Update node positions
      nodeElements.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Restart with smooth alpha
    simulation.alpha(0.6).restart();

    return () => {
      simulation.stop();
    };
  }, [
    simNodes,
    simLinks,
    selectedNodeId,
    searchResults,
    handleToggleCollapse,
    totalConceptsCount
  ]);

  const handleCopyNodeInfo = () => {
    if (!selectedNode) return;
    const pathText = selectedBreadcrumbs.map(n => n.name).join(' → ');
    const text = `[Concept]: ${selectedNode.name}\n[Path]: ${pathText}\n[Category]: ${selectedNode.category}\n[Mechanism/Detail]: ${selectedNode.description || 'N/A'}\n[Examiner Note]: ${selectedNode.examinerNote || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const visibleNodesCount = simNodes.length;
  const densityPercentage = Math.round((visibleNodesCount / Math.max(1, totalConceptsCount)) * 100);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl h-[calc(100vh-2rem)]' : 'w-full h-[680px]'
      } ${className}`}
    >
      {/* Top Controls & Navigation Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10">
        {/* Left: Title & Density Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Concept Mindmap
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-medium">
                {lecture.title}
              </span>
            </div>
            {/* Unboxed metadata per Section 1A */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>{totalConceptsCount} Concepts</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300 font-semibold">{visibleNodesCount} Active</span>
              <span aria-hidden="true">·</span>
              <span>{densityPercentage}% Density</span>
              <span aria-hidden="true">·</span>
              <span>{collapsedIds.size} Collapsed</span>
            </div>
          </div>
        </div>

        {/* Center: Density Presets (Segmented control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => handleSetDensity('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              densityPreset === 'overview'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Show only Level 1 major pillars"
          >
            <span>Overview</span>
          </button>
          <button
            onClick={() => handleSetDensity('standard')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              densityPreset === 'standard'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Balanced view with major steps & mechanisms"
          >
            <span>Standard</span>
          </button>
          <button
            onClick={() => handleSetDensity('deep')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              densityPreset === 'deep'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Exhaustive deep-dive with all fine sub-concepts"
          >
            <span>Deep-Dive</span>
          </button>
        </div>

        {/* Right: Search & Action Toolbar */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative min-w-[170px] max-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Find concept/trap..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-lg pl-8 pr-6 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Expand/Collapse All buttons */}
          <button
            onClick={handleExpandAll}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Expand All Branches"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={handleCollapseAll}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Collapse All Sub-Topics"
          >
            <EyeOff className="w-4 h-4" />
          </button>

          {/* Reset Zoom */}
          <button
            onClick={handleResetZoom}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Body: SVG on left, Inspector Drawer on right */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* Interactive SVG Canvas */}
        <div className="relative flex-1 h-full w-full bg-radial from-slate-900/60 via-slate-950 to-slate-950 overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          />

          {/* Floating Zoom & Canvas Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg z-20">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-800 my-auto" />
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer font-medium"
            >
              Fit View
            </button>
          </div>

          {/* Color Legend (Bottom Center) */}
          <div className="absolute bottom-4 right-4 md:right-auto md:left-44 hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 text-[11px] text-slate-400 z-10">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Mechanism</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Traps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Analogy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Pearls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Viva Details</span>
            </div>
          </div>

          {/* Floating Hover Tooltip */}
          {hoveredNode && (
            <div
              className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-md max-w-xs text-left"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: CATEGORY_COLORS[hoveredNode.category].stroke }} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {hoveredNode.category}
                </span>
                {hoveredNode.hasChildren && (
                  <span className="text-[10px] text-amber-400 font-semibold ml-auto">
                    {hoveredNode.isCollapsed ? `+${hoveredNode.totalDescendants} collapsed` : `${hoveredNode.childCount} sub-topics`}
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-white leading-tight">
                {hoveredNode.name}
              </div>
              {hoveredNode.description && (
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {hoveredNode.description}
                </p>
              )}
              <div className="mt-1.5 text-[10px] text-amber-400/90 font-mono">
                {hoveredNode.hasChildren ? 'Click to toggle collapse' : 'Click to inspect details'}
              </div>
            </div>
          )}
        </div>

        {/* Concept Detail Inspector Drawer (Right Side) */}
        <div className="w-80 md:w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 flex flex-col justify-between p-5 overflow-y-auto z-20">
          <div className="space-y-4">
            {/* Header: Breadcrumbs & Category */}
            <div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mb-1 overflow-x-auto scrollbar-none">
                {selectedBreadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                    <span
                      onClick={() => setSelectedNodeId(crumb.id)}
                      className={`cursor-pointer whitespace-nowrap hover:text-amber-400 ${
                        idx === selectedBreadcrumbs.length - 1 ? 'text-amber-400 font-semibold' : ''
                      }`}
                    >
                      {crumb.name.length > 14 ? crumb.name.slice(0, 14) + '…' : crumb.name}
                    </span>
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 mt-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${CATEGORY_COLORS[selectedNode.category].bg}`}>
                  {selectedNode.category} · Level {selectedNode.level}
                </span>

                <button
                  onClick={handleCopyNodeInfo}
                  className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
                  title="Copy concept summary"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <h3 className="text-lg font-bold font-display text-white mt-2 leading-snug">
                {selectedNode.name}
              </h3>
            </div>

            {/* Subtree Expand/Collapse Quick Control */}
            {selectedNode.children && selectedNode.children.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Branch Information Density:
                  </span>
                  <span className="text-amber-400 font-semibold">
                    {selectedNode.children.length} direct ({countTotalDescendants(selectedNode)} total)
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleToggleCollapse(selectedNode.id)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      collapsedIds.has(selectedNode.id)
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {collapsedIds.has(selectedNode.id) ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Expand Sub-Topics (+{countTotalDescendants(selectedNode)})</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Collapse Sub-Topics</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleFocusBranch(selectedNode.id)}
                    className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Collapse all other branches and focus this concept"
                  >
                    Focus
                  </button>
                </div>
              </div>
            )}

            {/* Explanation / Narrative */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Mechanistic / Scientific Breakdown
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                {selectedNode.description || lecture.summary}
              </div>
            </div>

            {/* Examiner Note / Trap Alert */}
            {selectedNode.examinerNote && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Examiner Testing Note</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-200/90 leading-relaxed">
                  {selectedNode.examinerNote}
                </div>
              </div>
            )}

            {/* Children concepts list if present */}
            {selectedNode.children && selectedNode.children.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Sub-Branches ({selectedNode.children.length})
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedNode.children.map(child => (
                    <div
                      key={child.id}
                      onClick={() => setSelectedNodeId(child.id)}
                      className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[child.category].stroke }}
                        />
                        <span className="text-slate-200 font-medium line-clamp-1">
                          {child.name}
                        </span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer: Practice Quiz & Viva */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            {onSelectLectureForQuiz && (
              <button
                onClick={() => onSelectLectureForQuiz(lecture)}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Test Topic in Quiz</span>
              </button>
            )}

            {onSelectLectureForExaminer && (
              <button
                onClick={() => onSelectLectureForExaminer(lecture.topic)}
                className="w-full py-2 bg-slate-950 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-900/40 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Face Angry Examiner on This Topic</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
