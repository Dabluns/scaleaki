"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirecionar para a página principal que tem login/registro integrado
    router.replace('/');
  }, [router]);

  return null;
}
