# Architecture Decision Records (ADR)

Ce dossier contiendra les **Architecture Decision Records** - les décisions techniques/architecturales du projet.

## 📋 Index des ADRs

> Aucun ADR pour le moment. Les ADRs seront créés lors de décisions architecturales importantes.

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

Voici des décisions qui mériteraient un ADR :

1. **ADR-001** : App Router vs Pages Router (Next.js)
2. **ADR-002** : Client Components vs Server Components strategy
3. **ADR-003** : Zod vs Yup pour validation
4. **ADR-004** : Framer Motion vs GSAP pour animations
5. **ADR-005** : Tailwind CSS vs CSS Modules
6. **ADR-006** : shadcn/ui copy-paste vs npm package UI library

## 📚 Ressources

- [ADR GitHub Organization](https://adr.github.io/)
- [MADR Template](https://github.com/adr/madr)
- [ADR Tools](https://github.com/npryce/adr-tools)
- [When to write ADRs](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

---

**Note** : Pour l'instant, les décisions techniques majeures sont documentées dans les PDRs (PDR-001 pour tech stack). Les ADRs seront créés quand le projet grandira et nécessitera des décisions architecturales plus granulaires.
