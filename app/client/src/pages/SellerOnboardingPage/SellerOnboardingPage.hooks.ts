import { useState } from "react";
import { trpc } from "@/lib/trpc";

export const useSellerOnboarding = () => {
  const utils = trpc.useUtils();
  const { data: progress, isLoading } =
    trpc.sellerOnboarding.getProgress.useQuery();

  const [justCompletedStepIndex, setJustCompletedStepIndex] = useState<
    number | null
  >(null);

  const invalidateAndAnimate = (stepIndex: number) => {
    utils.sellerOnboarding.getProgress.invalidate();
    setJustCompletedStepIndex(stepIndex);
  };

  const acceptRulesMutation = trpc.sellerOnboarding.acceptRules.useMutation({
    onSuccess: () => invalidateAndAnimate(0),
  });

  const saveCategoryMutation = trpc.sellerOnboarding.saveCategory.useMutation({
    onSuccess: () => invalidateAndAnimate(1),
  });

  const saveSubCategoryMutation =
    trpc.sellerOnboarding.saveSubCategory.useMutation({
      onSuccess: () => invalidateAndAnimate(2),
    });

  const saveSellerTypeMutation =
    trpc.sellerOnboarding.saveSellerType.useMutation({
      onSuccess: () => invalidateAndAnimate(3),
    });

  const saveSellingChannelsMutation =
    trpc.sellerOnboarding.saveSellingChannels.useMutation({
      onSuccess: () => invalidateAndAnimate(4),
    });

  const saveMonthlyRevenueMutation =
    trpc.sellerOnboarding.saveMonthlyRevenue.useMutation({
      onSuccess: () => invalidateAndAnimate(5),
    });

  const saveItemCountMutation = trpc.sellerOnboarding.saveItemCount.useMutation(
    { onSuccess: () => invalidateAndAnimate(6) },
  );

  const saveTeamSizeMutation = trpc.sellerOnboarding.saveTeamSize.useMutation({
    onSuccess: () => invalidateAndAnimate(7),
  });

  const saveLiveHoursMutation = trpc.sellerOnboarding.saveLiveHours.useMutation(
    { onSuccess: () => invalidateAndAnimate(8) },
  );

  const saveReturnAddressMutation =
    trpc.sellerOnboarding.saveReturnAddress.useMutation({
      onSuccess: () => invalidateAndAnimate(9),
    });

  const submitApplicationMutation =
    trpc.sellerOnboarding.submitApplication.useMutation({
      onSuccess: () => {
        utils.sellerOnboarding.getProgress.invalidate();
        utils.role.myRoles.invalidate();
      },
    });

  return {
    currentStepIndex: progress?.step ?? 0,
    surveyData: progress?.surveyData ?? null,
    sellerStatus: progress?.sellerStatus ?? "none",
    justCompletedStepIndex,
    clearCompletedAnimation: () => setJustCompletedStepIndex(null),
    handleAcceptRules: () => acceptRulesMutation.mutate(),
    handleSaveCategory: (category: string) =>
      saveCategoryMutation.mutate({ category }),
    handleSaveSubCategory: (subCategory: string) =>
      saveSubCategoryMutation.mutate({ subCategory }),
    handleSaveSellerType: (sellerType: "individual" | "registered_business") =>
      saveSellerTypeMutation.mutate({ sellerType }),
    handleSaveSellingChannels: (channels: string[]) =>
      saveSellingChannelsMutation.mutate({ channels }),
    handleSaveMonthlyRevenue: (range: string) =>
      saveMonthlyRevenueMutation.mutate({ range }),
    handleSaveItemCount: (range: string) =>
      saveItemCountMutation.mutate({ range }),
    handleSaveTeamSize: (range: string) =>
      saveTeamSizeMutation.mutate({ range }),
    handleSaveLiveHours: (range: string) =>
      saveLiveHoursMutation.mutate({ range }),
    handleSaveReturnAddress: (address: {
      street: string;
      city: string;
      zipCode: string;
      country: string;
    }) => saveReturnAddressMutation.mutate(address),
    handleSubmitApplication: () => submitApplicationMutation.mutate(),
    isLoading,
    isPending:
      acceptRulesMutation.isPending ||
      saveCategoryMutation.isPending ||
      saveSubCategoryMutation.isPending ||
      saveSellerTypeMutation.isPending ||
      saveSellingChannelsMutation.isPending ||
      saveMonthlyRevenueMutation.isPending ||
      saveItemCountMutation.isPending ||
      saveTeamSizeMutation.isPending ||
      saveLiveHoursMutation.isPending ||
      saveReturnAddressMutation.isPending ||
      submitApplicationMutation.isPending,
  };
};
