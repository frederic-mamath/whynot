# Architecture Decision Records (ADR)

Ce dossier contiendra les **Architecture Decision Records** - les décisions techniques/architecturales du projet.

## 📋 Index des ADRs

| ID                                     | Titre                                 | Status      | Date       |
| -------------------------------------- | ------------------------------------- | ----------- | ---------- |
| [001](001-custom-ffmpeg-rtmp-relay.md) | Custom FFmpeg RTMP Relay Architecture | ✅ Accepted | 2026-02-18 |

## 🎯 Qu'est-ce qu'un ADR ?

Un **Architecture Decision Record** documente :

- Les décisions architecturales et techniques importantes
- Le contexte technique au moment de la décision
- Les alternatives techniques considérées
- Les conséquences techniques (performances, scalabilité, maintenance)

## 📝 Différence ADR vs PDR

| Aspect       | ADR (Architecture)                    | PDR (Product)            |
| ------------ | ------------------------------------- | ------------------------ |
| **Focus**    | Décisions techniques                  | Décisions fonctionnelles |
| **Exemples** | "PostgreSQL vs MongoDB"               | "Blog vs pas de blog"    |
| **Audience** | Développeurs, architectes             | Product, stakeholders    |
| **Critères** | Performance, scalabilité, maintenance | UX, business value, ROI  |

## 🏗️ Structure d'un ADR

```markdown
# ADR-XXX: [Titre]

**Status**: Proposed | Accepted | Rejected | Deprecated | Superseded
**Date**: YYYY-MM-DD
**Technical Lead**: [Qui]

## Context

[Contexte technique, problème à résoudre]

## Decision

[Décision technique prise]

## Alternatives Considered

[Autres solutions techniques évaluées]

## Consequences

**Technical Impact**:

- Performance: [Impact]
- Scalability: [Impact]
- Maintenance: [Impact]
- Security: [Impact]

**Trade-offs**:
[Compromis techniques]

## Implementation

[Détails d'implémentation si pertinent]

## References

[RFCs, docs techniques, benchmarks]
```

## 💡 Exemples ADRs potentiels (futur)

Voici des décisions techniques qui mériteraient un ADR pour WhyNot :

1. **ADR-001**: Agora RTC vs Twilio vs WebRTC natif pour streaming
2. **ADR-002**: RTMP Converter vs All-RTC architecture pour scalabilité
3. **ADR-003**: PostgreSQL vs MongoDB pour données structurées
4. **ADR-004**: tRPC vs REST vs GraphQL pour API backend
5. **ADR-005**: Cloudflare Stream vs AWS MediaLive pour CDN
6. **ADR-006**: WebSocket vs Server-Sent Events pour chat temps réel
7. **ADR-007**: Redis vs Memcached pour cache de sessions
8. **ADR-008**: Kysely vs Prisma vs Drizzle pour query builder
9. **ADR-009**: Docker vs serverless pour déploiement
10. **ADR-010**: Auth0 vs Clerk vs custom auth pour authentification

---

**Note** : Les ADRs documentent les décisions **techniques/architecturales**. Pour les décisions fonctionnelles/produit (features, UX, business), utilise les PDRs dans `docs/pdr/`.

## 📚 Ressources

- [ADR GitHub Organization](https://adr.github.io/)
- [MADR Template](https://github.com/adr/madr)
- [ADR Tools](https://github.com/npryce/adr-tools)
- [When to write ADRs](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
