"""
LS-SVR for the Fractional Bratu Equation

Solves:  D^α u(x) + λ exp(u(x)) = 0,  x ∈ [0, 1],  with u(0) = u(1) = 0.

Uses Least Squares Support Vector Regression (LS-SVR) with RBF kernel:
  u(x) = Σ_i α_i K(x, x_i),  K(x,y) = exp(-γ (x-y)^2).
Caputo derivative D^α u is computed via the L1 scheme on the kernel expansion.
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.special import gamma
from scipy.optimize import fsolve
from time import time


# ---------------------------------------------------------------------------
# L1 scheme for Caputo fractional derivative
# ---------------------------------------------------------------------------

def L1_caputo(u_on_grid, alpha, x_grid=None):
    """L1 approximation of Caputo D^α u at uniformly spaced grid points."""
    u = np.asarray(u_on_grid).ravel()
    n = len(u)
    if x_grid is None:
        h = 1.0 / (n - 1)
    else:
        h = (x_grid[-1] - x_grid[0]) / (n - 1)
    coeff = 1.0 / (gamma(2 - alpha) * (h ** alpha))
    D_alpha_u = np.zeros(n)
    for i in range(1, n):
        s = 0.0
        for j in range(i):
            diff = (i - j) ** (1 - alpha) - (i - j - 1) ** (1 - alpha)
            s += (u[j + 1] - u[j]) * diff
        D_alpha_u[i] = coeff * s
    return D_alpha_u


# ---------------------------------------------------------------------------
# Reference solution (classical Bratu, α=1) and error metrics
# ---------------------------------------------------------------------------

def bratu_analytical_theta(lam):
    """Parameter θ for exact solution of classical Bratu u'' + λ exp(u)=0."""
    def eq(th):
        return th - np.sqrt(2 * lam) * np.cosh(th / 4)
    return float(fsolve(eq, 2.0)[0])


def bratu_exact_u(x, lam=1.0):
    """Exact solution for classical Bratu, u(0)=u(1)=0."""
    x = np.atleast_1d(x)
    th = bratu_analytical_theta(lam)
    return -2 * np.log(np.cosh((x - 0.5) * th / 2) / np.cosh(th / 4))


def rel_l2_error(u_pred, u_exact):
    u_pred = np.asarray(u_pred).ravel()
    u_exact = np.asarray(u_exact).ravel()
    return np.linalg.norm(u_pred - u_exact) / (np.linalg.norm(u_exact) + 1e-14)


def max_error(u_pred, u_exact):
    return np.max(np.abs(np.asarray(u_pred).ravel() - np.asarray(u_exact).ravel()))


# ---------------------------------------------------------------------------
# LS-SVR: RBF kernel and kernel matrices
# ---------------------------------------------------------------------------

def rbf_kernel(x, y, gamma=10.0):
    """RBF kernel K(x, y) = exp(-gamma * (x - y)^2). Supports broadcasting."""
    x, y = np.atleast_1d(x), np.atleast_1d(y)
    return np.exp(-gamma * (x - y) ** 2)


def build_kernel_matrices(x_grid, alpha, gamma=10.0):
    """
    Build K_mat and D_alpha_K on collocation grid.
    D_alpha_K[j, i] = (D^α of t -> K(t, x_i)) evaluated at x_j (L1 scheme).
    """
    x = np.asarray(x_grid).ravel()
    N = len(x)
    K_mat = np.exp(-gamma * (x[:, None] - x[None, :]) ** 2)
    D_alpha_K = np.zeros((N, N))
    for i in range(N):
        u_col = K_mat[:, i].copy()
        D_alpha_K[:, i] = L1_caputo(u_col, alpha, x_grid=x)
    return K_mat, D_alpha_K


def lssvr_bratu_residual(alpha, K_mat, D_alpha_K, lam, N):
    """Residual F(α): [u(0), interior PDE, u(1)]."""
    u = K_mat @ alpha
    D_alpha_u = D_alpha_K @ alpha
    F = np.zeros(N)
    F[0] = u[0]
    F[N - 1] = u[N - 1]
    for i in range(1, N - 1):
        F[i] = D_alpha_u[i] + lam * np.exp(u[i])
    return F


def solve_lssvr_bratu(alpha_param=0.75, lam=1.0, N=51, gamma=10.0, x_grid=None):
    """
    Solve fractional Bratu with LS-SVR.
    Returns: x_grid, alpha, K_mat, D_alpha_K, wall_time.
    """
    if x_grid is None:
        x_grid = np.linspace(0, 1, N, dtype=np.float64)
    else:
        x_grid = np.asarray(x_grid).ravel()
        N = len(x_grid)
    t0 = time()
    K_mat, D_alpha_K = build_kernel_matrices(x_grid, alpha_param, gamma)
    alpha0 = np.zeros(N)
    alpha, info, ier, msg = fsolve(
        lssvr_bratu_residual, alpha0,
        args=(K_mat, D_alpha_K, lam, N),
        full_output=True,
    )
    wall_time = time() - t0
    if ier != 1:
        print(f"Warning: fsolve did not converge (ier={ier}): {msg}")
    return x_grid, alpha, K_mat, D_alpha_K, wall_time


def lssvr_predict(x_eval, x_colloc, alpha, gamma=10.0):
    """Evaluate u(x) = Σ_i α_i K(x, x_i) at x_eval."""
    x_eval = np.atleast_1d(x_eval)
    x_colloc = np.asarray(x_colloc).ravel()
    K_eval = np.exp(-gamma * (x_eval[:, None] - x_colloc[None, :]) ** 2)
    return K_eval @ alpha


# ---------------------------------------------------------------------------
# Main: run and plot
# ---------------------------------------------------------------------------

def main():
    # Fractional case α=0.75
    print("LS-SVR fractional Bratu (α=0.75, λ=1)")
    x_grid, alpha, K_mat, D_alpha_K, wall = solve_lssvr_bratu(
        alpha_param=0.75, lam=1.0, N=51, gamma=10.0
    )
    print(f"  Solve time: {wall:.4f} s")

    x_plot = np.linspace(0, 1, 200)
    u_lssvr = lssvr_predict(x_plot, x_grid, alpha, gamma=10.0)

    plt.figure(figsize=(6, 4))
    plt.plot(x_plot, u_lssvr, "-", label="LS-SVR")
    plt.xlabel("$x$")
    plt.ylabel("$u(x)$")
    plt.title("Fractional Bratu $\\alpha=0.75$, $\\lambda=1$ (LS-SVR)")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig("lssvr_bratu_075.pdf", bbox_inches="tight")
    plt.show()

    # Classical case α=1 vs exact
    print("\nLS-SVR classical Bratu (α=1) vs exact")
    x_g1, alpha1, _, _, t1 = solve_lssvr_bratu(alpha_param=1.0, lam=1.0, N=51, gamma=10.0)
    u_lssvr_1 = lssvr_predict(x_plot, x_g1, alpha1, gamma=10.0)
    u_exact = bratu_exact_u(x_plot, 1.0)
    print(f"  Rel L2 error: {rel_l2_error(u_lssvr_1, u_exact):.6e}")
    print(f"  Max error:    {max_error(u_lssvr_1, u_exact):.6e}")
    print(f"  Time:         {t1:.4f} s")

    plt.figure(figsize=(6, 4))
    plt.plot(x_plot, u_exact, "k-", label="Exact ($\\alpha=1$)")
    plt.plot(x_plot, u_lssvr_1, "--", label="LS-SVR")
    plt.xlabel("$x$")
    plt.ylabel("$u(x)$")
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig("lssvr_bratu_alpha1.pdf", bbox_inches="tight")
    plt.show()


if __name__ == "__main__":
    main()
