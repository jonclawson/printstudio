import { useCallback as e, useEffect as t, useMemo as n, useRef as r } from "react";
import { Canvas as i, Image as a, Rect as o } from "fabric";
//#region \0rolldown/runtime.js
var s = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), c = /* @__PURE__ */ s(((e) => {
	var t = Symbol.for("react.transitional.element");
	function n(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.jsx = n, e.jsxs = n;
})), l = (/* @__PURE__ */ s(((e, t) => {
	t.exports = c();
})))();
function u({ config: s }) {
	let c = r(null), u = r(null), d = r(null), f = r(null), p = r(null), m = r(null), h = n(() => ({
		width: s.template_width,
		height: s.template_height
	}), [s.template_width, s.template_height]), g = e(() => new o({
		left: s.print_area_left,
		top: s.print_area_top,
		width: s.print_area_width,
		height: s.print_area_height,
		absolutePositioned: !0,
		originX: "left",
		originY: "top"
	}), [
		s.print_area_left,
		s.print_area_top,
		s.print_area_width,
		s.print_area_height
	]), _ = e(() => {
		let e = d.current, t = u.current;
		if (!e || !t) return;
		let n = t.clientWidth - 30, r = t.clientHeight - 30, i = Math.min(n / h.width, r / h.height);
		e.setDimensions({
			width: h.width * i,
			height: h.height * i
		}), e.setZoom(i), e.requestRenderAll();
	}, [h.height, h.width]), v = e(() => {
		let e = d.current;
		e && (e.off("after:render"), e.on("after:render", (t) => {
			let n = t.ctx;
			if (!n) return;
			let r = e.viewportTransform, i = e.getRetinaScaling();
			n.save(), n.setTransform(r[0] * i, r[1] * i, r[2] * i, r[3] * i, r[4] * i, r[5] * i), 1 / e.getZoom(), n.strokeStyle = "#dc3545", n.lineWidth = 8, n.setLineDash([20, 15]), n.strokeRect(s.print_area_left, s.print_area_top, s.print_area_width, s.print_area_height), n.fillStyle = "#dc3545", n.font = "bold 44px sans-serif", n.setLineDash([]), n.fillText("PRINT AREA BOUNDARY", s.print_area_left + 30, s.print_area_top + 65), n.restore();
		}));
	}, [
		s.print_area_height,
		s.print_area_left,
		s.print_area_top,
		s.print_area_width
	]), y = e((e) => new Promise((t, n) => {
		let r = new FileReader();
		r.onload = () => t(String(r.result)), r.onerror = () => n(/* @__PURE__ */ Error("Failed to read file")), r.readAsDataURL(e);
	}), []);
	t(() => {
		let e = c.current;
		if (!e) return;
		let t = new i(e, {
			backgroundColor: "rgba(0,0,0,0)",
			controlsAboveOverlay: !0,
			preserveObjectStacking: !0
		});
		d.current = t, _();
		let n = () => _();
		return window.addEventListener("resize", n), () => {
			window.removeEventListener("resize", n), t.off("after:render"), t.dispose(), d.current = null, f.current = null;
		};
	}, [v, _]), t(() => {
		let e = d.current;
		if (!e) return;
		let t = s.background_color;
		if (t) {
			if (p.current && e.contains(p.current)) {
				p.current.set({ fill: t }), e.requestRenderAll();
				return;
			}
			let n = new o({
				left: 0,
				top: 0,
				width: h.width,
				height: h.height,
				fill: t,
				selectable: !1,
				evented: !1,
				excludeFromExport: !0,
				absolutePositioned: !0,
				originX: "left",
				originY: "top"
			});
			p.current = n, e.insertAt(0, n), e.requestRenderAll();
		} else p.current && (e.remove(p.current), p.current.dispose(), p.current = null, e.requestRenderAll());
	}, [
		s.background_color,
		h.height,
		h.width
	]), t(() => {
		let e = d.current;
		if (!e) return;
		let t = { cancelled: !1 };
		return (async () => {
			let n = await (await fetch(s.image_url)).blob(), r = URL.createObjectURL(n), i = await a.fromURL(r);
			if (t.cancelled) {
				i.dispose();
				return;
			}
			f.current && (e.remove(f.current), f.current.dispose());
			let o = h.width / (i.width ?? 1), c = h.height / (i.height ?? 1), l = Math.min(o, c);
			i.set({
				scaleX: l,
				scaleY: l,
				left: h.width / 2,
				top: h.height / 2,
				originX: "center",
				originY: "center",
				selectable: !1,
				hoverCursor: "default",
				evented: !1
			}), f.current = i;
			let u = p.current && e.contains(p.current) ? 2 : 0;
			e.insertAt(u, i), e.requestRenderAll();
		})(), () => {
			t.cancelled = !0;
		};
	}, [
		s.image_url,
		h.height,
		h.width
	]);
	let b = e(async (e) => {
		let t = d.current;
		if (!t || !e) return;
		let n = g(), r = await y(e), i = await a.fromURL(r), o = s.print_area_width * .8 / (i.width ?? 1), c = s.print_area_height * .8 / (i.height ?? 1), l = Math.min(o, c, 1);
		i.set({
			left: s.print_area_left + s.print_area_width / 2,
			top: s.print_area_top + s.print_area_height / 2,
			originX: "center",
			originY: "center",
			scaleX: l,
			scaleY: l,
			cornerColor: "#007bff",
			cornerSize: 36,
			transparentCorners: !1,
			borderColor: "#007bff",
			borderScaleFactor: 4,
			clipPath: n
		}), t.insertAt(1, i), t.setActiveObject(i), t.requestRenderAll();
	}, [
		s.print_area_height,
		s.print_area_left,
		s.print_area_top,
		s.print_area_width,
		g,
		y
	]), x = e(() => {
		m.current?.click();
	}, []), S = e(async () => {
		let e = d.current, t = f.current;
		if (!e || !t) return;
		e.discardActiveObject(), e.requestRenderAll();
		let n = h.width, r = h.height;
		s.fill_mode === "cover" && (n = s.printfile_width, r = s.printfile_height);
		let a = new i(document.createElement("canvas"), {
			width: n,
			height: r,
			backgroundColor: "rgba(0,0,0,0)"
		}), o = g(), c = e.getObjects().filter((e) => e !== t && e !== p.current);
		await Promise.all(c.map(async (e) => {
			let t = await e.clone();
			t.clipPath = o, a.add(t);
		})), a.requestRenderAll();
		let l, u, m, _ = s.printfile_width / s.print_area_width, v = s.printfile_height / s.print_area_height;
		s.fill_mode === "cover" ? (l = Math.max(_, v), u = v == l ? s.printfile_width / v : s.print_area_width, m = _ == l ? s.printfile_height / _ : s.print_area_height) : (l = s.printfile_width / s.print_area_width, u = s.print_area_width, m = s.print_area_height);
		let y = a.toDataURL({
			format: "png",
			left: s.print_area_left,
			top: s.print_area_top,
			width: u,
			height: m,
			multiplier: l
		});
		if (a.dispose(), s.onExportComplete) {
			let e = await (await fetch(y)).blob(), t = new File([e], `print-area-${Date.now()}.png`, { type: "image/png" });
			await s.onExportComplete(t);
		} else {
			let e = document.createElement("a");
			e.download = `print-area-snapshot-${Date.now()}.png`, e.href = y, document.body.appendChild(e), e.click(), document.body.removeChild(e);
		}
		let b = new i(document.createElement("canvas"), {
			width: h.width,
			height: h.height,
			backgroundColor: "rgba(0,0,0,0)"
		}), x = e.getObjects();
		await Promise.all(x.map(async (e) => {
			let t = await e.clone();
			b.add(t);
		})), b.requestRenderAll();
		let S = b.toDataURL({
			format: "png",
			multiplier: 1
		});
		b.dispose();
		let C = await (await fetch(S)).blob(), w = new File([C], `thumb-${Date.now()}.png`, { type: "image/png" });
		if (s.onSaveThumb) {
			await s.onSaveThumb(w);
			return;
		}
		let T = document.createElement("a");
		T.download = `thumb-${Date.now()}.png`, T.href = S, document.body.appendChild(T), T.click(), document.body.removeChild(T);
	}, [
		s,
		g,
		h.height,
		h.width
	]);
	return /* @__PURE__ */ (0, l.jsxs)("div", {
		className: "app-container",
		children: [/* @__PURE__ */ (0, l.jsxs)("div", {
			className: "controls",
			children: [
				/* @__PURE__ */ (0, l.jsx)("button", {
					className: "export-btn",
					type: "button",
					onClick: x,
					children: "Upload"
				}),
				/* @__PURE__ */ (0, l.jsx)("input", {
					ref: m,
					type: "file",
					accept: "image/*",
					style: { display: "none" },
					onChange: (e) => void b(e.target.files?.[0] ?? null)
				}),
				/* @__PURE__ */ (0, l.jsx)("button", {
					className: "export-btn",
					type: "button",
					onClick: () => void S(),
					children: "Save"
				})
			]
		}), /* @__PURE__ */ (0, l.jsx)("div", {
			className: "workspace-stage",
			ref: u,
			children: /* @__PURE__ */ (0, l.jsx)("div", {
				className: "canvas-container",
				children: /* @__PURE__ */ (0, l.jsx)("canvas", { ref: c })
			})
		})]
	});
}
//#endregion
export { u as default };
