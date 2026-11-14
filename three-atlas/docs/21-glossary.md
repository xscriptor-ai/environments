# 21 — Glossary

## A

**AABB** — Axis-aligned bounding box. Cheap collision/culling volume aligned to world axes.

**Additive blending** — Blend mode that adds color; used for glow, sparks, energy. Order-independent.

**Aliasing** — Jagged edges or shimmering caused by sampling; fixed with MSAA, FXAA, SMAA, TAA, or higher DPR.

**Ambient light** — Uniform light from all directions; no shadows.

**Anisotropy** — Direction-dependent appearance. In materials: stretched highlights (brushed metal, hair). In textures: anisotropic filtering improves oblique-angle sampling.

**AO (ambient occlusion)** — Approximation of how much ambient light is blocked by nearby geometry; darkens cavities.

**Attribute** — Per-vertex data in a BufferGeometry (position, normal, uv, color, etc.).

## B

**Baking** — Precomputing lighting/shadows/AO into textures or lightmaps for runtime performance.

**Barycentric coordinates** — Coordinates of a point inside a triangle; used for interpolation.

**BatchedMesh** — Three.js object that renders many different geometries in one draw call, with per-instance transforms.

**Bezier curve** — Parametric curve defined by control points; used for paths and easing.

**Bloom** — Post-processing glow around bright areas.

**BRDF** — Bidirectional reflectance distribution function; describes how a surface reflects light. PBR uses microfacet BRDFs.

**Bump map** — Grayscale texture that perturbs normals for fake detail (less accurate than a normal map).

## C

**Camera** — Defines the view and projection. Perspective or orthographic.

**Clipping plane** — Plane that discards fragments/geometry on one side.

**Color space** — How color values map to physical light. Three.js works in linear-sRGB and outputs sRGB.

**Compute shader** — General-purpose GPU program (WebGPU); used for simulation, particles, post-processing.

**Contact shadow** — Small shadow under an object that grounds it; often a separate depth-based effect.

**Cubemap** — Six textures forming an environment around a point; used for reflections.

## D

**Depth buffer (z-buffer)** — Per-pixel depth used for occlusion.

**Depth of field (DOF)** — Blur based on distance from focus; mimics a lens.

**Diffuse** — Light scattered uniformly from a surface; matte appearance.

**Directional light** — Parallel light from infinity; sun-like.

**Displacement map** — Texture used to move vertices (real geometry) versus a normal map (only shading).

**Draw call** — CPU command to draw a batch of geometry. Fewer is generally better.

**DRACO** — Geometry compression format/library; reduces file size, requires a decoder.

## E

**ECS (Entity-Component-System)** — Data-oriented architecture for many entities.

**Emissive** — Light emitted by a material, independent of scene lighting.

**Environment map (IBL)** — HDR/cubemap lighting that provides ambient and reflections.

**Euler angles** — Three rotation angles with an order; simple but prone to gimbal lock.

## F

**fBm** — Fractal Brownian motion; sum of noise octaves.

**FOV (field of view)** — Vertical angle visible to a perspective camera.

**Frustum** — View volume (six planes) used for culling.

**Frustum culling** — Skipping objects outside the camera frustum.

**FXAA** — Fast approximate anti-aliasing; post-process, cheaper than MSAA/SMAA but blurrier.

## G

**G-buffer** — Render targets holding geometry data (position, normal, albedo) for deferred rendering/post effects.

**Gaussian splatting** — Scene representation using many anisotropic 3D Gaussians; photoreal captures.

**Gimbal lock** — Loss of a rotation degree of freedom with Euler angles when axes align.

**glTF** — Khronos runtime 3D format; GLB is its binary container.

**GPGPU** — General-purpose computing on the GPU.

**GPU** — Graphics processing unit.

## H

**HDR** — High dynamic range; values above 1.0, used for lighting and bloom.

**Hemisphere light** — Ambient light with sky/ground colors.

**I**

**IBL** — Image-based lighting; environment maps providing realistic ambient/reflections.

**InstancedMesh** — Renders many copies of one geometry in one draw call with per-instance transforms.

**IOR** — Index of refraction; controls bending of light in transmissive materials.

## J

**Jolt** — Physics engine available as a Three.js addon (WASM).

## K

**KTX2** — Container for GPU-compressed textures (Basis Universal); transcodes to ETC2/ASTC/BC7.

## L

**Lambert** — Diffuse-only shading model.

**LOD** — Level of detail; swaps simpler meshes at distance.

**Lightmap** — Baked lighting stored in a texture.

**Linear space** — Physically linear light values; correct for lighting math.

## M

**Material** — Shader + uniforms + textures defining surface appearance.

**Mesh** — Geometry + material.

**Metalness** — PBR parameter: 0 dielectric, 1 metal.

**Mipmap** — Prefiltered texture levels for minification; reduces aliasing and improves cache.

**Mixer** — `AnimationMixer`; plays animation clips.

**Morph target** — Alternate vertex positions blended by weights (facial expressions, shape keys).

**MSAA** — Multisample anti-aliasing; hardware edge smoothing.

**MVP** — Model-View-Projection matrix chain.

## N

**NDC** — Normalized device coordinates; `[-1,1]` x/y; z differs between WebGL `[-1,1]` and WebGPU `[0,1]`.

**NodeMaterial** — Three.js material built from TSL nodes; compiles to WGSL/GLSL.

**Normal map** — Texture encoding surface normals for detailed lighting.

**Normal matrix** — Inverse transpose of the model matrix's upper-left 3x3; transforms normals correctly.

## O

**OBB** — Oriented bounding box; can rotate.

**Occlusion culling** — Skipping objects hidden behind others.

**Opacity** — Alpha/transparency.

**OrbitControls** — Camera control that orbits around a target.

**Overdraw** — Multiple fragments shaded for the same pixel; costly, especially on mobile.

## P

**PBR** — Physically based rendering; metalness/roughness workflow.

**Perspective divide** — Dividing clip coordinates by `w` to get NDC.

**Ping-pong** — Alternating two render targets for iterative GPU simulation.

**Point light** — Omnidirectional light with distance falloff.

**Post-processing** — Full-screen effects after scene rendering.

**PMREM** — Prefiltered mipmapped radiance environment map; provides roughness-aware IBL.

**Procedural** — Generated by code rather than authored assets.

## Q

**Quaternion** — Four-component unit rotation representation; avoids gimbal lock and supports slerp.

## R

**Rapier** — Rust/WASM physics engine; recommended for Three.js.

**Raycaster** — Three.js class for ray-mesh intersection (picking).

**Reflection** — Mirror-like light bounce; via env maps, SSR, or planar reflectors.

**Refraction** — Bending of light through transparent media (IOR).

**Render target** — Offscreen framebuffer/texture used for post-processing, reflections, portals.

**RenderPipeline** — Three.js WebGPU multi-pass rendering system (r183+, formerly PostProcessing).

**Roughness** — PBR microsurface parameter; 0 mirror, 1 diffuse.

## S

**sRGB** — Standard display color encoding; decoded to linear for lighting.

**SSAO/GTAO** — Screen-space ambient occlusion variants.

**SSGI** — Screen-space global illumination.

**SSR** — Screen-space reflections.

**Shadow map** — Depth texture rendered from a light, used for shadows.

**Skinning** — Deforming a mesh with bones.

**Slerp** — Spherical linear interpolation; used for rotations.

**SMAA** — Subpixel morphological anti-aliasing; good quality post AA.

**Splat** — See Gaussian splatting.

**Sprite** — Camera-facing quad.

**Storage buffer** — GPU buffer readable/writable by shaders (WebGPU).

**Suspense** — React mechanism for async loading; used by R3F loaders.

## T

**Tangent** — Direction along a surface used with bitangent/normal for normal mapping.

**TAA** — Temporal anti-aliasing; uses previous frames and motion vectors.

**Tone mapping** — Compresses HDR into displayable range (ACES, AgX, Neutral, etc.).

**Transform** — Position/rotation/scale; represented by a matrix.

**Triangle** — Basic rendering primitive.

**TSL** — Three.js Shading Language; JavaScript node graph compiling to WGSL/GLSL.

**Tween** — Interpolation over time with easing.

## U

**UV** — 2D texture coordinates per vertex.

**Uniform** — Shader constant for a draw call, updated from JS.

## V

**Varying** — Value interpolated from vertex to fragment shader.

**Vertex** — Point with attributes; three vertices form a triangle.

**VSM** — Variance shadow maps; soft shadows with light-bleed artifacts.

## W

**WebGL2** — Browser graphics API; required by Three.js since r163.

**WebGPU** — Modern browser graphics/compute API; used by `WebGPURenderer`.

**WGSL** — WebGPU Shading Language.

**World matrix** — Transform from local to world space.

## X

**XR** — Virtual/augmented/mixed reality; WebXR API.

## Z

**Z-fighting** — Flickering when coplanar surfaces have similar depth values.

**Z-up / Y-up** — Coordinate convention for up axis; Three.js and glTF use Y-up, Blender uses Z-up.
