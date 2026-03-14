import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
    const faqs = [
        {
            question: "¿Realmente es gratis la prueba?",
            answer: "Sí, tienes 7 días de acceso completo a todas las funcionalidades del plan Prime sin necesidad de ingresar tarjeta de crédito. Al finalizar, puedes decidir si continuar o no."
        },
        {
            question: "¿Puedo cancelar en cualquier momento?",
            answer: "Absolutamente. No hay contratos a largo plazo ni letras chicas. Puedes cancelar tu suscripción desde tu panel de control con un solo clic."
        },
        {
            question: "¿Qué pasa si tengo más de una sucursal?",
            answer: "El plan Multisede está diseñado para un taller. Si tienes múltiples sucursales, te recomendamos el plan Enterprise que ofrece gestión centralizada y precios especiales por volumen."
        },
        {
            question: "¿Mis datos están seguros?",
            answer: "La seguridad es nuestra prioridad. Utilizamos encriptación de grado bancario para todos tus datos y realizamos copias de seguridad automáticas diarias."
        },
        {
            question: "¿Ofrecen soporte técnico?",
            answer: "Sí, todos los planes incluyen soporte. El plan Multisede cuenta con soporte prioritario por email y chat para asegurar que tu taller nunca se detenga."
        }
    ];

    return (
        <section id="faq" className="py-20 bg-background">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Preguntas Frecuentes
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Resolvemos tus dudas principales sobre GSM FIX
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                            <AccordionTrigger className="text-left text-lg font-medium py-6 hover:text-primary transition-colors">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
};

export default FAQSection;