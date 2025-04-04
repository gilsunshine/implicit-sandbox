export const sdfLibrary = 

`class SDF:
    def __init__(self, fn):
        self.fn = fn

    def __call__(self, x, y, z):
        return self.fn(x, y, z)

    def __add__(self, other):
        return union(self, other)

    def __sub__(self, other):
        return difference(self, other)

    def __mul__(self, other):
        return intersection(self, other)

    def __neg__(self):
        return SDF(lambda x, y, z: -self.fn(x, y, z))
    
    def __truediv__(self, other):
        if isinstance(other, SDF):
            return SDF(lambda x, y, z: np.divide(
                self.fn(x, y, z),
                other.fn(x, y, z),
                out=np.zeros_like(self.fn(x, y, z)),
                where=other.fn(x, y, z) != 0
            ))
        else:
            return SDF(lambda x, y, z: np.divide(
                self.fn(x, y, z),
                other,
                out=np.zeros_like(self.fn(x, y, z)),
                where=other != 0
            ))

    def __rtruediv__(self, other):
        return SDF(lambda x, y, z: np.divide(
            other,
            self.fn(x, y, z),
            out=np.zeros_like(self.fn(x, y, z)),
            where=self.fn(x, y, z) != 0
        ))

    def transform(self, matrix, origin=(0.0, 0.0, 0.0)):
        def transformed_fn(x, y, z):
            shape = x.shape
            pts = np.stack([x.ravel(), y.ravel(), z.ravel(), np.ones_like(x).ravel()])

            T_origin = translate_matrix(-origin[0], -origin[1], -origin[2])
            T_back = translate_matrix(origin[0], origin[1], origin[2])
            full_matrix = T_back @ matrix @ T_origin

            inv = np.linalg.inv(full_matrix)
            transformed = inv @ pts
            xt, yt, zt = transformed[0].reshape(shape), transformed[1].reshape(shape), transformed[2].reshape(shape)

            return self.fn(xt, yt, zt)
        return SDF(transformed_fn)
    
    def bounding_box_center(self, resolution=64, threshold=0.05):
        grid = np.linspace(0, 1, resolution)
        X, Y, Z = np.meshgrid(grid, grid, grid, indexing="ij")
        values = self(X, Y, Z)

        mask = np.abs(values) < threshold
        if not np.any(mask):
            return (0.5, 0.5, 0.5)  # fallback

        xs = X[mask]
        ys = Y[mask]
        zs = Z[mask]
        return (float(xs.mean()), float(ys.mean()), float(zs.mean()))

    def rotate_x(self, theta, origin=(0.5, 0.5, 0.5)):
        return self.transform(rotate_x_matrix(theta, origin))

    def rotate_y(self, theta, origin=(0.5, 0.5, 0.5)):
        return self.transform(rotate_y_matrix(theta, origin))

    def rotate_z(self, theta, origin=(0.5, 0.5, 0.5)):
        return self.transform(rotate_z_matrix(theta, origin))

    def translate(self, tx=0.0, ty=0.0, tz=0.0):
        return self.transform(translate_matrix(tx, ty, tz))

    def scale(self, sx=1.0, sy=1.0, sz=1.0, origin=(0.5, 0.5, 0.5)):
        return self.transform(scale_matrix(sx, sy, sz, origin))


def to_sdf(obj):
    return obj if isinstance(obj, SDF) else SDF(obj)

# --- SDF Primitives ---
# All based on the work of Inigo Quilez: https://iquilezles.org/

def sdf_sphere(center=(0.5, 0.5, 0.5), radius=0.3):
    return SDF(lambda x, y, z: np.sqrt(
        (x - center[0])**2 +
        (y - center[1])**2 +
        (z - center[2])**2
    ) - radius)

def sdf_box(bounds=(0.5, 0.5, 0.5), center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        b = np.array(bounds).reshape((3, 1, 1, 1))
        q = np.abs(p) - b
        outside = np.linalg.norm(np.maximum(q, 0), axis=0)
        inside = np.minimum(np.maximum.reduce(q, axis=0), 0.0)
        return outside + inside
    return SDF(_fn)

def sdf_rounded_box(bounds=(0.5, 0.5, 0.5), radius=0.1, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        b = np.array(bounds).reshape((3, 1, 1, 1))
        q = np.abs(p) - b + radius
        outside = np.linalg.norm(np.maximum(q, 0), axis=0)
        inside = np.minimum(np.maximum.reduce(q, axis=0), 0.0)
        return outside + inside - radius
    return SDF(_fn)

def sdf_box_frame(bounds=(0.5, 0.5, 0.5), edge_thickness=0.05, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        b = np.array(bounds).reshape((3, 1, 1, 1))
        e = edge_thickness
        p = np.abs(p) - b
        q = np.abs(p + e) - e

        def component(px, py, pz):
            d = np.maximum(np.array([px, py, pz]), 0.0)
            out = np.linalg.norm(d, axis=0)
            inside = np.minimum(np.maximum.reduce([px, py, pz]), 0.0)
            return out + inside

        d1 = component(p[0], q[1], q[2])
        d2 = component(q[0], p[1], q[2])
        d3 = component(q[0], q[1], p[2])
        return np.minimum(np.minimum(d1, d2), d3)
    return SDF(_fn)

def sdf_torus(t=(1.0, 0.25), center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        q = np.stack((np.sqrt(p[0]**2 + p[2]**2) - t[0], p[1]), axis=0)
        return np.linalg.norm(q, axis=0) - t[1]
    return SDF(_fn)

def sdf_capped_torus(sc=(0.5, 1.0), ra=1.0, rb=0.1, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        p_x = np.abs(p[0])
        condition = sc[1] * p_x > sc[0] * p[1]
        dot_product = p[0] * sc[0] + p[1] * sc[1]
        length_xy = np.sqrt(p[0]**2 + p[1]**2)
        k = np.where(condition, dot_product, length_xy)
        return np.sqrt(np.sum(p**2, axis=0) + ra**2 - 2.0 * ra * k) - rb
    return SDF(_fn)

def sdf_link(le=1.0, r1=0.5, r2=0.1, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        q = np.stack((p[0], np.maximum(np.abs(p[1]) - le, 0.0), p[2]), axis=0)
        return np.sqrt((np.sqrt(q[0]**2 + q[1]**2) - r1)**2 + q[2]**2) - r2
    return SDF(_fn)

def sdf_cone(c=(0.8, 0.6), h=1.0, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        q = np.sqrt(p[0]**2 + p[2]**2)
        return np.maximum(c[0] * q + c[1] * p[1], -h - p[1])
    return SDF(_fn)

def sdf_plane(n=(0.0, 1.0, 0.0), h=0.0, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        # Normalize n if not already normalized
        n_array = np.array(n).reshape(3, 1, 1, 1)
        n_norm = n_array / np.linalg.norm(n_array, axis=0)
        return np.sum(p * n_norm, axis=0) + h
    return SDF(_fn)

def sdf_hex_prism(h=(1.0, 1.0), center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        k = np.array([-0.8660254, 0.5, 0.57735]).reshape(3, 1, 1, 1)
        p = np.abs(p)
        
        # p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy
        dot_product = k[0] * p[0] + k[1] * p[1]
        min_dot = np.minimum(dot_product, 0.0)
        p[0] -= 2.0 * min_dot * k[0]
        p[1] -= 2.0 * min_dot * k[1]
        
        # Calculate d
        clamp_val = np.clip(p[0], -k[2] * h[0], k[2] * h[0])
        d_x = np.sqrt((p[0] - clamp_val)**2 + p[1]**2) * np.sign(p[1] - h[0])
        d_y = p[2] - h[1]
        d = np.stack((d_x, d_y), axis=0)
        
        return np.minimum(np.maximum(d[0], d[1]), 0.0) + np.linalg.norm(np.maximum(d, 0.0), axis=0)
    return SDF(_fn)

def sdf_tri_prism(h=(1.0, 1.0), center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        q = np.abs(p)
        return np.maximum(q[2] - h[1], np.maximum(q[0] * 0.866025 + p[1] * 0.5, -p[1]) - h[0] * 0.5)
    return SDF(_fn)

def sdf_capsule(a=(0.0, 0.0, 0.0), b=(1.0, 1.0, 1.0), r=0.2, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        a_array = np.array(a).reshape(3, 1, 1, 1)
        b_array = np.array(b).reshape(3, 1, 1, 1)
        
        pa = p - a_array
        ba = b_array - a_array
        
        # Calculate dot products
        pa_dot_ba = pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]
        ba_dot_ba = ba[0]**2 + ba[1]**2 + ba[2]**2
        
        h = np.clip(pa_dot_ba / ba_dot_ba, 0.0, 1.0)
        
        # Calculate final distance
        diff = pa - ba * h.reshape(1, *h.shape)
        return np.sqrt(np.sum(diff**2, axis=0)) - r
    return SDF(_fn)

def sdf_capped_cylinder(a=(0.0, 0.0, 0.0), b=(0.0, 1.0, 0.0), r=0.5, center=(0.5, 0.5, 0.5), h=1.0):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        a_array = np.array(a).reshape(3, 1, 1, 1)
        b_array = np.array(b).reshape(3, 1, 1, 1)

        # Apply height scaling to the axis
        b_scaled = a_array + (b_array - a_array) * h
        ba = b_scaled - a_array
        pa = p - a_array

        baba = np.sum(ba * ba, axis=0)
        paba = np.sum(pa * ba, axis=0)

        x = np.sqrt(np.sum((pa * baba - ba * paba.reshape(1, *paba.shape))**2, axis=0)) - r * baba
        y = np.abs(paba - baba * 0.5) - baba * 0.5

        x2 = x * x
        y2 = y * y * baba

        d = np.where(np.maximum(x, y) < 0.0,
                     -np.minimum(x2, y2),
                     np.where(x > 0.0, x2, 0.0) + np.where(y > 0.0, y2, 0.0))

        return np.sign(d) * np.sqrt(np.abs(d)) / baba
    return SDF(_fn)

def sdf_rounded_cylinder(ra=0.5, rb=0.1, h=1.0, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        d = np.stack((np.sqrt(p[0]**2 + p[2]**2) - 2.0 * ra + rb, np.abs(p[1]) - h), axis=0)
        return np.minimum(np.maximum(d[0], d[1]), 0.0) + np.sqrt(np.sum(np.maximum(d, 0.0)**2, axis=0)) - rb
    return SDF(_fn)

def sdf_capped_cone(a=(0.0, 0.0, 0.0), b=(0.0, 1.0, 0.0), ra=0.5, rb=0.1, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        a_array = np.array(a).reshape(3, 1, 1, 1)
        b_array = np.array(b).reshape(3, 1, 1, 1)
        
        rba = rb - ra
        ba = b_array - a_array
        baba = np.sum(ba * ba, axis=0)
        
        pa = p - a_array
        papa = np.sum(pa * pa, axis=0)
        paba = np.sum(pa * ba, axis=0) / baba
        
        x = np.sqrt(papa - paba * paba * baba)
        cax = np.maximum(0.0, x - np.where(paba < 0.5, ra, rb))
        cay = np.abs(paba - 0.5) - 0.5
        
        k = rba * rba + baba
        f = np.clip((rba * (x - ra) + paba * baba) / k, 0.0, 1.0)
        
        cbx = x - ra - f * rba
        cby = paba - f
        
        s = np.where((cbx < 0.0) & (cay < 0.0), -1.0, 1.0)
        return s * np.sqrt(np.minimum(cax * cax + cay * cay * baba, cbx * cbx + cby * cby * baba))
    return SDF(_fn)

def sdf_cut_sphere(r=1.0, h=0.5, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        
        # Sampling independent computations
        w = np.sqrt(r * r - h * h)
        
        # Sampling dependent computations
        q = np.stack((np.sqrt(p[0]**2 + p[2]**2), p[1]), axis=0)
        s = np.maximum((h - r) * q[0]**2 + w**2 * (h + r - 2.0 * q[1]), h * q[0] - w * q[1])
        
        condition1 = s < 0.0
        condition2 = q[0] < w
        
        result1 = np.sqrt(q[0]**2 + q[1]**2) - r
        result2 = h - q[1]
        result3 = np.sqrt((q[0] - w)**2 + (q[1] - h)**2)
        
        return np.where(condition1, result1, np.where(condition2, result2, result3))
    return SDF(_fn)

def sdf_cut_hollow_sphere(r=1.0, h=0.5, t=0.1, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        
        # Sampling independent computations
        w = np.sqrt(r * r - h * h)
        
        # Sampling dependent computations
        q = np.stack((np.sqrt(p[0]**2 + p[2]**2), p[1]), axis=0)
        
        condition = h * q[0] < w * q[1]
        result1 = np.sqrt((q[0] - w)**2 + (q[1] - h)**2)
        result2 = np.abs(np.sqrt(q[0]**2 + q[1]**2) - r)
        
        return np.where(condition, result1, result2) - t
    return SDF(_fn)

def sdf_round_cone(a=(0.0, 0.0, 0.0), b=(0.0, 1.0, 0.0), r1=0.5, r2=0.1, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        a_array = np.array(a).reshape(3, 1, 1, 1)
        b_array = np.array(b).reshape(3, 1, 1, 1)
        
        # Sampling independent computations
        ba = b_array - a_array
        l2 = np.sum(ba * ba, axis=0)
        rr = r1 - r2
        a2 = l2 - rr * rr
        il2 = 1.0 / l2
        
        # Sampling dependent computations
        pa = p - a_array
        y = np.sum(pa * ba, axis=0)
        z = y - l2
        
        # dot2() is just dot product of a vector with itself
        x2 = np.sum((pa * l2 - ba * y.reshape(1, *y.shape))**2, axis=0)
        y2 = y * y * l2
        z2 = z * z * l2
        
        k = np.sign(rr) * rr * rr * x2
        
        condition1 = np.sign(z) * a2 * z2 > k
        condition2 = np.sign(y) * a2 * y2 < k
        
        result1 = np.sqrt(x2 + z2) * il2 - r2
        result2 = np.sqrt(x2 + y2) * il2 - r1
        result3 = (np.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1
        
        return np.where(condition1, result1, np.where(condition2, result2, result3))
    return SDF(_fn)

def sdf_ellipsoid(r=(1.0, 0.5, 1.0), center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        r_array = np.array(r).reshape(3, 1, 1, 1)
        
        k0 = np.sqrt(np.sum((p / r_array)**2, axis=0))
        k1 = np.sqrt(np.sum((p / (r_array * r_array))**2, axis=0))
        
        return k0 * (k0 - 1.0) / k1
    return SDF(_fn)

def sdf_pyramid(h=1.0, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        
        m2 = h * h + 0.25
        
        # p.xz = abs(p.xz)
        p_xz = np.abs(np.stack((p[0], p[2]), axis=0))
        
        # p.xz = (p.z>p.x) ? p.zx : p.xz
        condition = p_xz[1] > p_xz[0]
        p_x = np.where(condition, p_xz[1], p_xz[0])
        p_z = np.where(condition, p_xz[0], p_xz[1])
        
        # p.xz -= 0.5
        p_x -= 0.5
        p_z -= 0.5
        
        q = np.stack((
            p_z,
            h * p[1] - 0.5 * p_x,
            h * p_x + 0.5 * p[1]
        ), axis=0)
        
        s = np.maximum(-q[0], 0.0)
        t = np.clip((q[1] - 0.5 * p_z) / (m2 + 0.25), 0.0, 1.0)
        
        a = m2 * (q[0] + s)**2 + q[1]**2
        b = m2 * (q[0] + 0.5 * t)**2 + (q[1] - m2 * t)**2
        
        d2 = np.where(np.maximum(q[1], -q[0] * m2 - q[1] * 0.5) > 0.0, 0.0, np.minimum(a, b))
        
        return np.sqrt((d2 + q[2]**2) / m2) * np.sign(np.maximum(q[2], -p[1]))
    return SDF(_fn)

def sdf_octahedron(s=1.0, center=(0.5, 0.5, 0.5)):
    def _fn(x, y, z):
        p = np.stack((x - center[0], y - center[1], z - center[2]), axis=0)
        p = np.abs(p)
        return (p[0] + p[1] + p[2] - s) * 0.57735027  # 1/sqrt(3)
    return SDF(_fn)

# --- Patterns ---

def wave_pattern(freq=8.0):
    return SDF(lambda x, y, z: np.sin(freq * x) + np.sin(freq * y) + np.sin(freq * z))

def gyroid(freq=5.0):
    f = freq * np.pi
    return SDF(lambda x, y, z: (
        np.sin(f * x) * np.cos(f * y) +
        np.sin(f * y) * np.cos(f * z) +
        np.sin(f * z) * np.cos(f * x)
    ) / 3.0)

# --- Compositing ---

def _as_callable(f):
    if isinstance(f, SDF):
        return f.fn
    elif callable(f):
        return f
    else:
        return lambda *_: f

def union(a, b):
    a, b = _as_callable(a), _as_callable(b)
    return SDF(lambda x, y, z: np.minimum(a(x, y, z), b(x, y, z)))

def intersection(a, b):
    a, b = _as_callable(a), _as_callable(b)
    return SDF(lambda x, y, z: np.maximum(a(x, y, z), b(x, y, z)))

def difference(a, b):
    a, b = _as_callable(a), _as_callable(b)
    return SDF(lambda x, y, z: np.maximum(a(x, y, z), -b(x, y, z)))

def xor(a, b):
    a, b = _as_callable(a), _as_callable(b)
    return SDF(lambda x, y, z: np.maximum(
        np.minimum(a(x, y, z), b(x, y, z)),
        -np.maximum(a(x, y, z), b(x, y, z))
    ))

def smooth_union(a, b, k):
    a, b = _as_callable(a), _as_callable(b)
    return SDF(lambda x, y, z: (
        lambda d1, d2, h: h * d1 + (1 - h) * d2 - k * h * (1 - h)
    )(
        a(x, y, z),
        b(x, y, z),
        np.clip(0.5 + 0.5 * (b(x, y, z) - a(x, y, z)) / k, 0.0, 1.0)
    ))

def smooth_intersection(a, b, k):
    a, b = _as_callable(a), _as_callable(b)
    return SDF(lambda x, y, z: (
        lambda d1, d2, h: (1 - h) * d2 + h * d1 + k * h * (1 - h)
    )(
        a(x, y, z),
        b(x, y, z),
        np.clip(0.5 - 0.5 * (b(x, y, z) - a(x, y, z)) / k, 0.0, 1.0)
    ))

def smooth_difference(a, b, k):
    a, b = _as_callable(a), _as_callable(b)
    return SDF(lambda x, y, z: (
        lambda d1, d2, h: (1 - h) * d2 + h * (-d1) + k * h * (1 - h)
    )(
        b(x, y, z),
        a(x, y, z),
        np.clip(0.5 - 0.5 * (b(x, y, z) + a(x, y, z)) / k, 0.0, 1.0)
    ))


# --- Transformations ---

def translate_matrix(tx=0.0, ty=0.0, tz=0.0):
    T = np.eye(4)
    T[:3, 3] = [tx, ty, tz]
    return T

def rotate_x_matrix(theta, origin=(0.0, 0.0, 0.0)):
    c, s = np.cos(theta), np.sin(theta)
    
    R = np.eye(4)
    R[1, 1], R[1, 2] = c, -s
    R[2, 1], R[2, 2] = s,  c

    T1 = np.eye(4)
    T1[:3, 3] = -np.array(origin)

    T2 = np.eye(4)
    T2[:3, 3] = np.array(origin)

    return T2 @ R @ T1


def rotate_y_matrix(theta, origin=(0.0, 0.0, 0.0)):
    c, s = np.cos(theta), np.sin(theta)
    
    R = np.eye(4)
    R[0, 0], R[0, 2] =  c, s
    R[2, 0], R[2, 2] = -s, c

    T1 = np.eye(4)
    T1[:3, 3] = -np.array(origin)

    T2 = np.eye(4)
    T2[:3, 3] = np.array(origin)

    return T2 @ R @ T1


def rotate_z_matrix(theta, origin=(0.0, 0.0, 0.0)):
    c, s = np.cos(theta), np.sin(theta)
    
    R = np.eye(4)
    R[0, 0], R[0, 1] = c, -s
    R[1, 0], R[1, 1] = s,  c

    T1 = np.eye(4)
    T1[:3, 3] = -np.array(origin)

    T2 = np.eye(4)
    T2[:3, 3] = np.array(origin)

    return T2 @ R @ T1


def scale_matrix(sx=1.0, sy=1.0, sz=1.0, origin=(0.0, 0.0, 0.0)):
    S = np.eye(4)
    S[0, 0], S[1, 1], S[2, 2] = sx, sy, sz

    T1 = np.eye(4)
    T1[:3, 3] = -np.array(origin)

    T2 = np.eye(4)
    T2[:3, 3] = np.array(origin)

    return T2 @ S @ T1

def combine(*mats):
    result = np.eye(4)
    for m in reversed(mats):
        result = result @ m
    return result

def blend(a, b, mask):
    if callable(mask):
        return SDF(lambda x, y, z: (
            (1 - (m := mask(x, y, z))) * a(x, y, z) + m * b(x, y, z)
        ))
    else:
        return SDF(lambda x, y, z: (1 - mask) * a(x, y, z) + mask * b(x, y, z))

def lerp(a, b, t):
    if callable(t):
        return SDF(lambda x, y, z: (
            (1 - (tt := t(x, y, z))) * a(x, y, z) + tt * b(x, y, z)
        ))
    else:
        return SDF(lambda x, y, z: (1 - t) * a(x, y, z) + t * b(x, y, z))
    

# --- Utilities ---
    
def normalize_to_sdf_range(f):
    """
    Normalize a scalar field to the SDF range [-1, 1].

    Works with either:
    - a NumPy array
    - a callable (x, y, z) -> array
    """
    if callable(f):
        return lambda x, y, z: normalize_to_sdf_range(f(x, y, z))
    else:
        f_min = np.min(f)
        f_max = np.max(f)
        if np.isclose(f_max - f_min, 0.0):
            return np.zeros_like(f)
        normalized = (f - f_min) / (f_max - f_min)
        return normalized * 2.0 - 1.0
    
def op_round(primitive, rad=0.1):
    """
    Creates a rounded version of any SDF primitive.
    
    Parameters:
    primitive: An SDF function created by any of the sdf_* functions
    rad: The radius of the rounding
    
    Returns:
    A new SDF object with rounded edges
    """
    def _fn(x, y, z):
        # Call the original primitive's distance function
        dist = primitive.fn(x, y, z)
        # Subtract the rounding radius from the distance
        return dist - rad
    return SDF(_fn)

def op_onion(primitive, thickness=0.1):
    """
    Creates a hollow/shell version of any SDF primitive with specified thickness.
    
    Parameters:
    primitive: An SDF function created by any of the sdf_* functions
    thickness: The thickness of the shell
    
    Returns:
    A new SDF object representing a hollow shell version of the input
    """
    def _fn(x, y, z):
        # Call the original primitive's distance function
        dist = primitive.fn(x, y, z)
        # Take absolute value and subtract thickness
        return np.abs(dist) - thickness
    return SDF(_fn)

def op_displace(primitive, displacement_fn):
    """
    Displaces an SDF primitive using a displacement function.
    
    Parameters:
    primitive: An SDF function created by any of the sdf_* functions
    displacement_fn: A function that takes x, y, z coordinates and returns a displacement value
    
    Returns:
    A new SDF object with the displacement applied
    """
    def _fn(x, y, z):
        # Call the original primitive's distance function
        d1 = primitive.fn(x, y, z)
        # Call the displacement function
        d2 = displacement_fn(x, y, z)
        # Add the displacement to the original distance
        return d1 + d2
    return SDF(_fn)

def op_twist(primitive, k=10.0, center=(0.5, 0.5, 0.5), axis=(0.0, 1.0, 0.0)):
    """
    Applies a twist deformation along a specified axis to an SDF primitive.
    
    Parameters:
    primitive: An SDF function created by any of the sdf_* functions
    k: The amount of twist (higher values = more twist)
    center: The center point of the twist operation
    axis: The axis around which to twist (will be normalized)
    
    Returns:
    A new SDF object with the twist deformation
    """
    def _fn(x, y, z):
        # Shift by center
        p_x = x - center[0]
        p_y = y - center[1]
        p_z = z - center[2]
        
        # Normalize the axis
        axis_len = np.sqrt(axis[0]**2 + axis[1]**2 + axis[2]**2)
        if axis_len < 1e-6:
            # Default to Y-axis if given zero vector
            n_axis = np.array([0.0, 1.0, 0.0]).reshape(3, 1, 1, 1)
        else:
            n_axis = np.array([axis[0]/axis_len, axis[1]/axis_len, axis[2]/axis_len]).reshape(3, 1, 1, 1)
        
        # Project point onto axis to find twist amount
        p = np.stack((p_x, p_y, p_z), axis=0)
        proj = np.sum(p * n_axis, axis=0)
        
        # Compute rotation angle based on projection
        angle = k * proj
        c = np.cos(angle)
        s = np.sin(angle)
        
        # Create a basis where one vector is the twist axis
        # Find two perpendicular vectors to the axis
        t1 = np.zeros_like(n_axis)
        if np.abs(n_axis[0]) < np.abs(n_axis[1]):
            if np.abs(n_axis[0]) < np.abs(n_axis[2]):
                t1[0] = 1.0
            else:
                t1[2] = 1.0
        else:
            if np.abs(n_axis[1]) < np.abs(n_axis[2]):
                t1[1] = 1.0
            else:
                t1[2] = 1.0
                
        # First perpendicular vector (cross product)
        t1 = np.cross(n_axis, t1, axis=0)
        t1_len = np.sqrt(np.sum(t1**2, axis=0))
        t1 = t1 / t1_len
        
        # Second perpendicular vector (cross product of axis and t1)
        t2 = np.cross(n_axis, t1, axis=0)
        
        # Project point onto perpendicular plane
        p_perp1 = np.sum(p * t1, axis=0)
        p_perp2 = np.sum(p * t2, axis=0)
        
        # Apply rotation in this plane
        p_rot1 = c * p_perp1 - s * p_perp2
        p_rot2 = s * p_perp1 + c * p_perp2
        
        # Reconstruct the point
        q = n_axis * proj + t1 * p_rot1 + t2 * p_rot2
        
        # Shift back and evaluate original primitive
        return primitive.fn(q[0] + center[0], q[1] + center[1], q[2] + center[2])
    return SDF(_fn)

def op_cheap_bend(primitive, k=10.0, center=(0.5, 0.5, 0.5), axis=(1.0, 0.0, 0.0), bend_axis=(0.0, 1.0, 0.0)):
    """
    Applies a cheap bending deformation along a specified axis to an SDF primitive.
    
    Parameters:
    primitive: An SDF function created by any of the sdf_* functions
    k: The amount of bending (higher values = more bending)
    center: The center point of the bend operation
    axis: The axis along which to measure distance for bending (will be normalized)
    bend_axis: The axis determining the plane of bending (perpendicular to this)
    
    Returns:
    A new SDF object with the bending deformation
    """
    def _fn(x, y, z):
        # Shift by center
        p_x = x - center[0]
        p_y = y - center[1]
        p_z = z - center[2]
        p = np.stack((p_x, p_y, p_z), axis=0)
        
        # Normalize the axes
        axis_len = np.sqrt(axis[0]**2 + axis[1]**2 + axis[2]**2)
        if axis_len < 1e-6:
            # Default to X-axis if given zero vector
            n_axis = np.array([1.0, 0.0, 0.0]).reshape(3, 1, 1, 1)
        else:
            n_axis = np.array([axis[0]/axis_len, axis[1]/axis_len, axis[2]/axis_len]).reshape(3, 1, 1, 1)
            
        bend_len = np.sqrt(bend_axis[0]**2 + bend_axis[1]**2 + bend_axis[2]**2)
        if bend_len < 1e-6:
            # Default to Y-axis if given zero vector
            n_bend = np.array([0.0, 1.0, 0.0]).reshape(3, 1, 1, 1)
        else:
            n_bend = np.array([bend_axis[0]/bend_len, bend_axis[1]/bend_len, bend_axis[2]/bend_len]).reshape(3, 1, 1, 1)
        
        # Make sure bend_axis is perpendicular to axis (if not already)
        dot = np.sum(n_axis * n_bend, axis=0)
        n_bend = n_bend - n_axis * dot
        bend_len = np.sqrt(np.sum(n_bend**2, axis=0))
        # Check if axes were nearly parallel
        if bend_len < 1e-6:
            # Choose a different bend axis
            if np.abs(n_axis[0]) < np.abs(n_axis[1]):
                if np.abs(n_axis[0]) < np.abs(n_axis[2]):
                    n_bend = np.array([1.0, 0.0, 0.0]).reshape(3, 1, 1, 1)
                else:
                    n_bend = np.array([0.0, 0.0, 1.0]).reshape(3, 1, 1, 1)
            else:
                if np.abs(n_axis[1]) < np.abs(n_axis[2]):
                    n_bend = np.array([0.0, 1.0, 0.0]).reshape(3, 1, 1, 1)
                else:
                    n_bend = np.array([0.0, 0.0, 1.0]).reshape(3, 1, 1, 1)
            # Make sure it's perpendicular
            dot = np.sum(n_axis * n_bend, axis=0)
            n_bend = n_bend - n_axis * dot
            bend_len = np.sqrt(np.sum(n_bend**2, axis=0))
        
        n_bend = n_bend / bend_len
        
        # Third axis to complete coordinate system
        n_third = np.cross(n_axis, n_bend, axis=0)
        
        # Project point onto the three basis vectors
        proj_axis = np.sum(p * n_axis, axis=0)
        proj_bend = np.sum(p * n_bend, axis=0)
        proj_third = np.sum(p * n_third, axis=0)
        
        # Compute rotation angle based on projection along main axis
        angle = k * proj_axis
        c = np.cos(angle)
        s = np.sin(angle)
        
        # Apply rotation around the third axis
        new_proj_bend = c * proj_bend - s * proj_third
        new_proj_third = s * proj_bend + c * proj_third
        
        # Reconstruct the point
        q = n_axis * proj_axis + n_bend * new_proj_bend + n_third * new_proj_third
        
        # Shift back and evaluate original primitive
        return primitive.fn(q[0] + center[0], q[1] + center[1], q[2] + center[2])
    return SDF(_fn)`;