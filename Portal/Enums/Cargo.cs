using System.ComponentModel;

namespace Portal.Enums
{
    public enum Cargo
    {
        [Description("AUX. DE MANUTENÇÃO PREDIAL")]
        AuxManutencaoPredial,

        [Description("AUX. DE ELETRICISTA")]
        AuxEletricista,

        [Description("AJUDANDE DE CARGA E DESCARGA")]
        AjudanteCargaDescarga,

        [Description("SERRALHEIRO/MARCENEIRO/ESTOFADOR")]
        SerralheiroMarceneiroEstofador,

        [Description("OFICIAIS DE MANUTENÇÃO PREDIAL")]
        OficiaisManutencaoPredial,

        [Description("TÉCNICO ELETRÔNICA")]
        TecnicoEletronica,

        [Description("TÉCNICO ELETRÔMECÂNICA")]
        TecnicoEletromecânica,

        [Description("TÉCNICO EDIFICAÇÃO")]
        TecnicoEdificacao,

        [Description("ENGENHEIROS")]
        Engenheiros,

        [Description("TÉCNICO INDUSTRIAL")]
        TecnicoIndustrial,

        [Description("ELETRICISTA")]
        Eletricista,
    }
}