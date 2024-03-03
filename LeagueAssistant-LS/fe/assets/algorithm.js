class AppAlgo {
    static calculateWR(W, L){ return 100*W/Math.max(1, W+L) }
    static calculateKDA(K, D, A){ return (K+A)/Math.max(1, D) }
}