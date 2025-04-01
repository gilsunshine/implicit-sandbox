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

# def transform(sdf, matrix):
#     def _fn(x, y, z):
#         shape = x.shape
#         points = np.stack([x.ravel(), y.ravel(), z.ravel(), np.ones_like(x).ravel()])
#         inv = np.linalg.inv(matrix)
#         transformed = inv @ points
#         xt, yt, zt = transformed[0].reshape(shape), transformed[1].reshape(shape), transformed[2].reshape(shape)
#         return sdf(xt, yt, zt)
#     return SDF(_fn)

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


# def rotate_x(theta):
#     return lambda sdf: transform(sdf, rotate_x_matrix(theta))

# def rotate_y(theta):
#     return lambda sdf: transform(sdf, rotate_y_matrix(theta))

# def rotate_z(theta):
#     return lambda sdf: transform(sdf, rotate_z_matrix(theta))

# def translate(tx=0.0, ty=0.0, tz=0.0):
#     return lambda sdf: transform(sdf, translate_matrix(tx, ty, tz))

# def scale(sx=1.0, sy=1.0, sz=1.0):
#     return lambda sdf: transform(sdf, scale_matrix(sx, sy, sz))

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
`;