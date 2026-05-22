/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      // R1 — Routers must not import from src/db/ directly (use repositories)
      name: "no-router-db-import",
      severity: "error",
      comment: "Routers must go through repositories, never query the db directly.",
      from: {
        path: "^src/routers/",
        pathNot: [
          // TODO: src/routers/vendorPromotion.ts — queries db directly
          "^src/routers/vendorPromotion\\.ts$",
          // TODO: src/routers/shop.ts — queries db directly
          "^src/routers/shop\\.ts$",
          // TODO: src/routers/sellerOnboarding.ts — queries db directly
          "^src/routers/sellerOnboarding\\.ts$",
          // TODO: src/routers/profile.ts — queries db directly
          "^src/routers/profile\\.ts$",
          // TODO: src/routers/package.ts — queries db directly
          "^src/routers/package\\.ts$",
          // TODO: src/routers/live.ts — queries db directly
          "^src/routers/live\\.ts$",
          // TODO: src/routers/auction.ts — queries db directly
          "^src/routers/auction\\.ts$",
        ],
      },
      to: { path: "^src/db/" },
    },
    {
      // R5 — Repository classes can only be imported via src/repositories/index.ts
      name: "no-direct-repository-imports",
      severity: "error",
      comment: "Import repository singletons via src/repositories/index.ts, not directly.",
      from: {
        pathNot: [
          "^src/repositories/", // index.ts and Repository files themselves are allowed
          // TODO: src/routers/payment.ts — imports UserRepository directly
          "^src/routers/payment\\.ts$",
          // TODO: src/routers/auction.ts — imports UserRepository, AddressRepository directly
          "^src/routers/auction\\.ts$",
          // TODO: src/routers/profile.ts — imports UserRepository, AddressRepository directly
          "^src/routers/profile\\.ts$",
          // TODO: src/routers/package.ts — imports PackageRepository directly
          "^src/routers/package\\.ts$",
          // TODO: src/routers/waitlist.ts — imports WaitlistRepository directly
          "^src/routers/waitlist\\.ts$",
          // TODO: src/index.ts — imports PackageRepository directly
          "^src/index\\.ts$",
        ],
      },
      to: { path: "^src/repositories/.*Repository\\.ts$" },
    },
    {
      // R6 — Only client/src/lib/trpc.ts may import from @trpc/client or @trpc/react-query
      name: "no-raw-trpc-import",
      severity: "error",
      comment: "All tRPC client usage must flow through client/src/lib/trpc.ts.",
      from: {
        pathNot: [
          "^client/src/lib/trpc\\.ts$",
          // TODO: client/src/App.tsx — imports httpBatchLink, splitLink, wsLink from @trpc/client
          "^client/src/App\\.tsx$",
        ],
      },
      to: { path: "^node_modules/@trpc/(client|react-query)/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "./tsconfig.json" },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
