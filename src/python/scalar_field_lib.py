import numpy as np

#SDFs

def sdf_sphere(x, y, z, center=(0.5, 0.5, 0.5), radius=0.3):
    dx = x - center[0]
    dy = y - center[1]
    dz = z - center[2]
    return np.sqrt(dx**2 + dy**2 + dz**2) - radius

def sdf_cube(x, y, z, center=(0.5, 0.5, 0.5), size=0.4):
    dx = np.abs(x - center[0]) - size
    dy = np.abs(y - center[1]) - size
    dz = np.abs(z - center[2]) - size
    outside = np.maximum.reduce([dx, dy, dz])
    inside = np.minimum(np.maximum(dx, np.maximum(dy, dz)), 0)
    return outside + inside

# Gaussian Fields (blobby, soft shapes)

def gaussian_sphere(x, y, z, center=(0.5, 0.5, 0.5), strength=30.0):
    dx = x - center[0]
    dy = y - center[1]
    dz = z - center[2]
    r2 = dx**2 + dy**2 + dz**2
    return np.exp(-strength * r2)

def gaussian_cube(x, y, z, center=(0.5, 0.5, 0.5), scale=30.0):
    dx = (x - center[0])**2
    dy = (y - center[1])**2
    dz = (z - center[2])**2
    return np.exp(-scale * (dx + dy + dz))


# Utilities
def smooth_step(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def clamp(x, min_val=0.0, max_val=1.0):
    return np.clip(x, min_val, max_val)

def normalize_to_sdf_range(f):
    f = f - f.min()
    f = f / (f.max() + 1e-8)
    return f * 2 - 1


# Patterns

def gyroid(x, y, z, freq=5.0):
    f = freq * np.pi
    return (
        np.sin(f * x) * np.cos(f * y) +
        np.sin(f * y) * np.cos(f * z) +
        np.sin(f * z) * np.cos(f * x)
    ) / 3.0

def wave_pattern(x, y, z, freq=8.0):
    return np.sin(freq * x) + np.sin(freq * y) + np.sin(freq * z)


# Compositing

def union(a, b):
    return np.minimum(a, b)

def intersection(a, b):
    return np.maximum(a, b)

def subtraction(a, b):
    return np.maximum(a, -b)

def smooth_union(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return np.interp(h, [0, 1], [b, a]) - k * h * (1.0 - h)

def smooth_intersection(a, b, k):
    h = np.clip(0.5 - 0.5 * (b - a) / k, 0.0, 1.0)
    return np.interp(h, [0, 1], [b, a]) + k * h * (1.0 - h)

def smooth_subtraction(a, b, k):
    h = np.clip(0.5 - 0.5 * (b + a) / k, 0.0, 1.0)
    return np.interp(h, [0, 1], [a, -b]) + k * h * (1.0 - h)


# Blending

def lerp(a, b, t):
    return (1 - t) * a + t * b

def blend(a, b, mask):
    return (1 - mask) * a + mask * b