import * as THREE from 'three';

/**
 * Throttled pointer interaction with hover and click callbacks.
 * Raycasts only once per frame, not on every pointermove event.
 *
 * For dense meshes, enable BVH:
 *   import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
 *   THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
 *   THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
 *   THREE.Mesh.prototype.raycast = acceleratedRaycast;
 *   mesh.geometry.computeBoundsTree();
 */
export class PointerInteraction {
  constructor({ canvas, camera, objects, onHover, onClick, onChangeCursor = true }) {
    this.canvas = canvas;
    this.camera = camera;
    this.objects = objects;
    this.onHover = onHover ?? (() => {});
    this.onClick = onClick ?? (() => {});
    this.onChangeCursor = onChangeCursor;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(0, 0);
    this.dirty = false;
    this.hovered = null;
    this.inside = false;

    this.handleMove = this.handleMove.bind(this);
    this.handleDown = this.handleDown.bind(this);
    this.handleLeave = this.handleLeave.bind(this);

    canvas.addEventListener('pointermove', this.handleMove, { passive: true });
    canvas.addEventListener('pointerdown', this.handleDown);
    canvas.addEventListener('pointerleave', this.handleLeave);
  }

  updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.inside = true;
    this.dirty = true;
  }

  handleMove(event) {
    this.updatePointer(event);
  }

  handleDown(event) {
    this.updatePointer(event);
    const hit = this.pick();
    if (hit) this.onClick(hit, event);
  }

  handleLeave() {
    this.inside = false;
    this.dirty = true;
  }

  pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.objects, true);

    for (const hit of hits) {
      let node = hit.object;
      while (node && node.visible === false) node = node.parent;
      if (node) return hit;
    }

    return null;
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;

    const hit = this.inside ? this.pick() : null;
    const next = hit?.object ?? null;

    if (next !== this.hovered) {
      this.hovered = next;
      this.onHover(hit);
      if (this.onChangeCursor) {
        this.canvas.style.cursor = next ? 'pointer' : 'default';
      }
    }
  }

  dispose() {
    this.canvas.removeEventListener('pointermove', this.handleMove);
    this.canvas.removeEventListener('pointerdown', this.handleDown);
    this.canvas.removeEventListener('pointerleave', this.handleLeave);
  }
}
