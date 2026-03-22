/**
 * Utilitários para formatação de texto na interface.
 */

/**
 * Corrige textos que possuem underscores, substituindo-os por espaços normais.
 * Ex: "facebook_ads" -> "Facebook Ads"
 */
export const formatLabel = (text: string | undefined | null): string => {
    if (!text) return '';

    // Substituir underscores por espaços
    let formatted = text.replace(/_/g, ' ');

    // Opcional: Capitalizar a primeira letra de cada palavra para labels mais bonitas
    // Se o usuário preferir manter como está, apenas removemos o underscore
    return formatted;
};

/**
 * Especializado para tags e badges onde queremos uppercase e sem underscores.
 */
export const formatBadge = (text: string | undefined | null): string => {
    if (!text) return '';
    return text.replace(/_/g, ' ').toUpperCase();
};
