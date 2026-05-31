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
	let c = r(null), u = r(null), d = r(null), f = r(null), p = r(null), m = n(() => ({
		width: s.template_width,
		height: s.template_height
	}), [s.template_width, s.template_height]), h = e(() => new o({
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
	]), g = e(() => {
		let e = d.current, t = u.current;
		if (!e || !t) return;
		let n = t.clientWidth - 30, r = t.clientHeight - 30, i = Math.min(n / m.width, r / m.height);
		e.setDimensions({
			width: m.width * i,
			height: m.height * i
		}), e.setZoom(i), e.renderAll();
	}, [m.height, m.width]), _ = e(() => {
		let e = d.current;
		e && (e.off("after:render"), e.on("after:render", (e) => {
			let t = e.ctx;
			t && (t.save(), t.strokeStyle = "#dc3545", t.lineWidth = 8, t.setLineDash([20, 15]), t.strokeRect(s.print_area_left, s.print_area_top, s.print_area_width, s.print_area_height), t.fillStyle = "#dc3545", t.font = "bold 44px sans-serif", t.setLineDash([]), t.fillText("PRINT AREA BOUNDARY", s.print_area_left + 30, s.print_area_top + 65), t.restore());
		}));
	}, [
		s.print_area_height,
		s.print_area_left,
		s.print_area_top,
		s.print_area_width
	]), v = e((e) => new Promise((t, n) => {
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
		d.current = t, g(), _();
		let n = () => g();
		return window.addEventListener("resize", n), () => {
			window.removeEventListener("resize", n), t.off("after:render"), t.dispose(), d.current = null, f.current = null;
		};
	}, [_, g]), t(() => {
		let e = d.current;
		if (!e) return;
		let t = { cancelled: !1 };
		return (async () => {
			let n = await a.fromURL(s.image_url);
			if (t.cancelled) {
				n.dispose();
				return;
			}
			f.current && (e.remove(f.current), f.current.dispose());
			let r = m.width / (n.width ?? 1), i = m.height / (n.height ?? 1), o = Math.min(r, i);
			n.set({
				scaleX: o,
				scaleY: o,
				left: m.width / 2,
				top: m.height / 2,
				originX: "center",
				originY: "center",
				selectable: !1,
				hoverCursor: "default"
			}), f.current = n, e.insertAt(0, n), e.renderAll();
		})(), () => {
			t.cancelled = !0;
		};
	}, [
		s.image_url,
		m.height,
		m.width
	]);
	let y = e(async (e) => {
		let t = d.current;
		if (!t || !e) return;
		let n = h(), r = await v(e), i = await a.fromURL(r), o = s.print_area_width * .8 / (i.width ?? 1), c = s.print_area_height * .8 / (i.height ?? 1), l = Math.min(o, c, 1);
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
		}), t.add(i), t.setActiveObject(i), t.renderAll();
	}, [
		s.print_area_height,
		s.print_area_left,
		s.print_area_top,
		s.print_area_width,
		h,
		v
	]), b = e(() => {
		p.current?.click();
	}, []), x = e(async () => {
		let e = d.current, t = f.current;
		if (!e || !t) return;
		e.discardActiveObject(), e.renderAll();
		let n = new i(document.createElement("canvas"), {
			width: m.width,
			height: m.height,
			backgroundColor: "rgba(0,0,0,0)"
		}), r = h(), a = e.getObjects().filter((e) => e !== t);
		await Promise.all(a.map(async (e) => {
			let t = await e.clone();
			t.clipPath = r, n.add(t);
		})), n.renderAll();
		let o = n.toDataURL({
			format: "png",
			left: s.print_area_left,
			top: s.print_area_top,
			width: s.print_area_width,
			height: s.print_area_height,
			multiplier: s.printfile_width / s.print_area_width
		});
		if (n.dispose(), s.onExportComplete) {
			let e = await (await fetch(o)).blob(), t = new File([e], `print-area-${Date.now()}.png`, { type: "image/png" });
			await s.onExportComplete(t);
			return;
		}
		let c = document.createElement("a");
		c.download = `print-area-snapshot-${Date.now()}.png`, c.href = o, document.body.appendChild(c), c.click(), document.body.removeChild(c);
	}, [
		s,
		h,
		m.height,
		m.width
	]);
	return /* @__PURE__ */ (0, l.jsxs)("div", {
		className: "app-container",
		children: [/* @__PURE__ */ (0, l.jsxs)("div", {
			className: "controls",
			children: [
				/* @__PURE__ */ (0, l.jsx)("button", {
					className: "export-btn",
					type: "button",
					onClick: b,
					children: "Upload Artwork"
				}),
				/* @__PURE__ */ (0, l.jsx)("input", {
					ref: p,
					type: "file",
					accept: "image/*",
					style: { display: "none" },
					onChange: (e) => void y(e.target.files?.[0] ?? null)
				}),
				/* @__PURE__ */ (0, l.jsx)("button", {
					className: "export-btn",
					type: "button",
					onClick: () => void x(),
					children: "Export Full Template Snapshot"
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
