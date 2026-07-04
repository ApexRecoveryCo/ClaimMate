import { Container } from "@/components/ui/Container";
import { NewClaimWizard } from "@/components/claims/NewClaimWizard";

export default function NewClaimPage() {
  return (
    <Container className="flex flex-col gap-6 py-8">
      <NewClaimWizard />
    </Container>
  );
}
