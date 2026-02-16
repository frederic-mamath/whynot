# Product Decision Records (PDR)

Ce dossier contient tous les **Product Decision Records** du projet WhyNot - les décisions produit/fonctionnelles qui guident le développement de la plateforme de live shopping.

## 📋 Index des PDRs

| ID | Titre | Status | Date |
|----|-------|--------|------|
| [001](001-buyer-viewing-experience-hls-vs-rtc.md) | Buyer Viewing Experience - HLS vs RTC | ✅ Accepted | 2026-02-16 |

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

## 💡 Exemples PDRs potentiels (futur)

Voici des décisions produit qui mériteraient un PDR pour WhyNot :

1. **PDR-001**: Buyer HLS vs RTC viewing experience (latence vs coût)
2. **PDR-002**: Chat en direct vs messages différés
3. **PDR-003**: Système d'enchères vs prix fixe pour produits
4. **PDR-004**: Workflow de paiement (Stripe Checkout vs Payment Intents)
5. **PDR-005**: Gestion multi-boutiques vs boutique unique par vendeur
6. **PDR-006**: Interface verticale (TikTok) vs horizontale (YouTube) pour lives
7. **PDR-007**: Modération automatique vs manuelle des messages en direct
8. **PDR-008**: Notifications push vs SMS pour début de live
9. **PDR-009**: Replay des lives vs live uniquement
10. **PDR-010**: Commission plateforme (%, flat, freemium)

---

**Note** : Les PDRs documentent les décisions **fonctionnelles/produit**. Pour les décisions purement techniques (choix de base de données, architecture API, etc.), utilise les ADRs dans `docs/adr/`.
