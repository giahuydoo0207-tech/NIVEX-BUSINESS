import { PaymentCheckout } from "@/components/business/PaymentCheckout";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ paymentRequestId: string }>;
}) {
  const { paymentRequestId } = await params;
  return <PaymentCheckout paymentRequestId={paymentRequestId} />;
}
