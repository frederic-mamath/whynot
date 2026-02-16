# Product Decision Records (PDR)

Ce dossier contient tous les **Product Decision Records** du projet - les décisions produit/fonctionnelles qui guident le développement du portfolio freelance.

## 📋 Index des PDRs

| ID                                  | Titre                                | Status      | Date       |
| ----------------------------------- | ------------------------------------ | ----------- | ---------- |
| [001](001-tech-stack.md)            | Choix de la stack technique          | ✅ Accepted | 2026-01-25 |
| [002](002-portfolio-sections.md)    | Sections du portfolio MVP            | ✅ Accepted | 2026-01-26 |
| [003](003-optimization-strategy.md) | Stratégie d'optimisation performance | ✅ Accepted | 2026-02-01 |
| [004](004-contact-form.md)          | Formulaire de contact vs Calendly    | ✅ Accepted | 2026-01-30 |
| [005](005-no-blog-mvp.md)           | Pas de blog en Phase 1               | ✅ Accepted | 2026-01-26 |

## 🎯 Qu'est-ce qu'un PDR ?

Un **Product Decision Record** documente :

- Les décisions produit/fonctionnelles importantes
- Le contexte et les contraintes au moment de la décision
- Les alternatives considérées
- Les conséquences (positives et négatives)
- Les métriques de succès

## 📝 Quand créer un PDR ?

Crée un PDR quand :

- ✅ Tu choisis une fonctionnalité vs une autre
- ✅ Tu rejettes une demande utilisateur
- ✅ Tu définis la roadmap produit
- ✅ Tu fais un trade-off important (scope, qualité, délai)

Ne crée PAS de PDR pour :

- ❌ Décisions techniques/architecture → Utilise ADR
- ❌ Décisions mineures réversibles
- ❌ Décisions évidentes sans alternative

## 🏗️ Structure d'un PDR

```markdown
# PDR-XXX: [Titre]

**Status**: Proposed | Accepted | Rejected | Deprecated
**Date**: YYYY-MM-DD
**Decision Makers**: [Qui]
**Stakeholders**: [Qui est impacté]

## Context

[Situation, problème à résoudre]

## Decision

[Décision prise]

## Alternatives Considered

[Autres options évaluées]

## Consequences

**Positives**: [Bénéfices]
**Negatives**: [Trade-offs]
**Risks**: [Risques]

## Success Metrics

[Comment mesurer le succès]

## References

[Liens, docs, discussions]
```

## 🔄 Workflow

1. **Créer** un PDR en status `Proposed`
2. **Discuter** avec stakeholders
3. **Décider** et passer en `Accepted` ou `Rejected`
4. **Implémenter** (si Accepted)
5. **Déprécier** si la décision n'est plus valide

## 📚 Ressources

- [Architecture Decision Records](https://adr.github.io/)
- [MADR Template](https://github.com/adr/madr)
- [ADR Tools](https://github.com/npryce/adr-tools)
