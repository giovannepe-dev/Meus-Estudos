export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checkouts: {
        Row: {
          assinatura_devolucao: string | null
          assinatura_retirada: string
          company_id: string
          created_at: string
          criado_por_user_id: string
          data_hora_devolucao: string | null
          data_hora_retirada: string
          destino_rota: string | null
          foto_hodometro_devolucao: string | null
          foto_hodometro_retirada: string
          id: string
          km_devolucao: number | null
          km_divergente: boolean
          km_retirada: number
          km_rodado: number | null
          motivo_uso: string
          motorista_id: string
          nivel_combustivel_devolucao: string | null
          nivel_combustivel_retirada: string | null
          observacoes_devolucao: string | null
          observacoes_retirada: string | null
          status: Database["public"]["Enums"]["checkout_status"]
          updated_at: string
          veiculo_id: string
        }
        Insert: {
          assinatura_devolucao?: string | null
          assinatura_retirada: string
          company_id: string
          created_at?: string
          criado_por_user_id: string
          data_hora_devolucao?: string | null
          data_hora_retirada?: string
          destino_rota?: string | null
          foto_hodometro_devolucao?: string | null
          foto_hodometro_retirada: string
          id?: string
          km_devolucao?: number | null
          km_divergente?: boolean
          km_retirada: number
          km_rodado?: number | null
          motivo_uso: string
          motorista_id: string
          nivel_combustivel_devolucao?: string | null
          nivel_combustivel_retirada?: string | null
          observacoes_devolucao?: string | null
          observacoes_retirada?: string | null
          status?: Database["public"]["Enums"]["checkout_status"]
          updated_at?: string
          veiculo_id: string
        }
        Update: {
          assinatura_devolucao?: string | null
          assinatura_retirada?: string
          company_id?: string
          created_at?: string
          criado_por_user_id?: string
          data_hora_devolucao?: string | null
          data_hora_retirada?: string
          destino_rota?: string | null
          foto_hodometro_devolucao?: string | null
          foto_hodometro_retirada?: string
          id?: string
          km_devolucao?: number | null
          km_divergente?: boolean
          km_retirada?: number
          km_rodado?: number | null
          motivo_uso?: string
          motorista_id?: string
          nivel_combustivel_devolucao?: string | null
          nivel_combustivel_retirada?: string | null
          observacoes_devolucao?: string | null
          observacoes_retirada?: string | null
          status?: Database["public"]["Enums"]["checkout_status"]
          updated_at?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkouts_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          endereco: string | null
          id: string
          ja_ativada: boolean
          logo_url: string | null
          max_usuarios: number | null
          nome: string
          slug: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          ja_ativada?: boolean
          logo_url?: string | null
          max_usuarios?: number | null
          nome: string
          slug: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          ja_ativada?: boolean
          logo_url?: string | null
          max_usuarios?: number | null
          nome?: string
          slug?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_locations: {
        Row: {
          checkout_id: string
          company_id: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          motorista_id: string
          recorded_at: string
        }
        Insert: {
          checkout_id: string
          company_id: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          motorista_id: string
          recorded_at?: string
        }
        Update: {
          checkout_id?: string
          company_id?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          motorista_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_records: {
        Row: {
          company_id: string
          comprovante_foto: string | null
          created_at: string
          data_hora: string
          id: string
          km_no_abastecimento: number | null
          litros: number
          motorista_id: string
          observacoes: string | null
          posto_nome: string | null
          registrado_por_user_id: string
          tipo_combustivel: Database["public"]["Enums"]["fuel_type"]
          updated_at: string
          valor_total: number
          veiculo_id: string
        }
        Insert: {
          company_id: string
          comprovante_foto?: string | null
          created_at?: string
          data_hora?: string
          id?: string
          km_no_abastecimento?: number | null
          litros: number
          motorista_id: string
          observacoes?: string | null
          posto_nome?: string | null
          registrado_por_user_id: string
          tipo_combustivel: Database["public"]["Enums"]["fuel_type"]
          updated_at?: string
          valor_total: number
          veiculo_id: string
        }
        Update: {
          company_id?: string
          comprovante_foto?: string | null
          created_at?: string
          data_hora?: string
          id?: string
          km_no_abastecimento?: number | null
          litros?: number
          motorista_id?: string
          observacoes?: string | null
          posto_nome?: string | null
          registrado_por_user_id?: string
          tipo_combustivel?: Database["public"]["Enums"]["fuel_type"]
          updated_at?: string
          valor_total?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          checkout_id: string | null
          company_id: string
          created_at: string
          custo_estimado: number | null
          custo_final: number | null
          data_hora: string
          descricao: string
          fotos: string[]
          gravidade: Database["public"]["Enums"]["severity_level"]
          id: string
          motorista_id: string
          observacoes: string | null
          registrado_por_user_id: string
          status: Database["public"]["Enums"]["incident_status"]
          tipo: Database["public"]["Enums"]["incident_type"]
          updated_at: string
          veiculo_id: string
          veiculo_imobilizado: boolean
        }
        Insert: {
          checkout_id?: string | null
          company_id: string
          created_at?: string
          custo_estimado?: number | null
          custo_final?: number | null
          data_hora?: string
          descricao: string
          fotos?: string[]
          gravidade?: Database["public"]["Enums"]["severity_level"]
          id?: string
          motorista_id: string
          observacoes?: string | null
          registrado_por_user_id: string
          status?: Database["public"]["Enums"]["incident_status"]
          tipo: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
          veiculo_id: string
          veiculo_imobilizado?: boolean
        }
        Update: {
          checkout_id?: string | null
          company_id?: string
          created_at?: string
          custo_estimado?: number | null
          custo_final?: number | null
          data_hora?: string
          descricao?: string
          fotos?: string[]
          gravidade?: Database["public"]["Enums"]["severity_level"]
          id?: string
          motorista_id?: string
          observacoes?: string | null
          registrado_por_user_id?: string
          status?: Database["public"]["Enums"]["incident_status"]
          tipo?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
          veiculo_id?: string
          veiculo_imobilizado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "incidents_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          abastecido: boolean
          avarias_encontradas: string | null
          calibracao_pneus: string
          company_id: string
          created_at: string
          data_inspecao: string
          id: string
          inspecionado_por_user_id: string
          km_inspecao: number | null
          nivel_agua: string
          nivel_oleo: string
          observacoes: string | null
          updated_at: string
          veiculo_id: string
        }
        Insert: {
          abastecido?: boolean
          avarias_encontradas?: string | null
          calibracao_pneus?: string
          company_id: string
          created_at?: string
          data_inspecao?: string
          id?: string
          inspecionado_por_user_id: string
          km_inspecao?: number | null
          nivel_agua?: string
          nivel_oleo?: string
          observacoes?: string | null
          updated_at?: string
          veiculo_id: string
        }
        Update: {
          abastecido?: boolean
          avarias_encontradas?: string | null
          calibracao_pneus?: string
          company_id?: string
          created_at?: string
          data_inspecao?: string
          id?: string
          inspecionado_por_user_id?: string
          km_inspecao?: number | null
          nivel_agua?: string
          nivel_oleo?: string
          observacoes?: string | null
          updated_at?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      km_divergences: {
        Row: {
          checkout_id: string
          company_id: string
          created_at: string
          data_hora: string
          foto_odometro: string | null
          geolocation: string | null
          id: string
          image_hash: string | null
          ip: string | null
          justificativa: string | null
          km_divergente: number
          km_esperado: number
          km_informado: number
          km_ocr: number | null
          motivo: string | null
          motorista_id: string
          severidade: string
          status: string
          updated_at: string
          veiculo_id: string
        }
        Insert: {
          checkout_id: string
          company_id: string
          created_at?: string
          data_hora?: string
          foto_odometro?: string | null
          geolocation?: string | null
          id?: string
          image_hash?: string | null
          ip?: string | null
          justificativa?: string | null
          km_divergente: number
          km_esperado: number
          km_informado: number
          km_ocr?: number | null
          motivo?: string | null
          motorista_id: string
          severidade?: string
          status?: string
          updated_at?: string
          veiculo_id: string
        }
        Update: {
          checkout_id?: string
          company_id?: string
          created_at?: string
          data_hora?: string
          foto_odometro?: string | null
          geolocation?: string | null
          id?: string
          image_hash?: string | null
          ip?: string | null
          justificativa?: string | null
          km_divergente?: number
          km_esperado?: number
          km_informado?: number
          km_ocr?: number | null
          motivo?: string | null
          motorista_id?: string
          severidade?: string
          status?: string
          updated_at?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "km_divergences_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "km_divergences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "km_divergences_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          company_id: string
          comprovante_foto: string | null
          created_at: string
          custo: number | null
          data_agendada: string | null
          data_realizada: string | null
          descricao: string | null
          id: string
          km_na_manutencao: number | null
          status: Database["public"]["Enums"]["maintenance_status"]
          tipo_servico: string
          updated_at: string
          veiculo_id: string
        }
        Insert: {
          company_id: string
          comprovante_foto?: string | null
          created_at?: string
          custo?: number | null
          data_agendada?: string | null
          data_realizada?: string | null
          descricao?: string | null
          id?: string
          km_na_manutencao?: number | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          tipo_servico: string
          updated_at?: string
          veiculo_id: string
        }
        Update: {
          company_id?: string
          comprovante_foto?: string | null
          created_at?: string
          custo?: number | null
          data_agendada?: string | null
          data_realizada?: string | null
          descricao?: string | null
          id?: string
          km_na_manutencao?: number | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          tipo_servico?: string
          updated_at?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_closings: {
        Row: {
          company_id: string
          created_at: string
          gerado_por_user_id: string
          id: string
          mes_referencia: string
        }
        Insert: {
          company_id: string
          created_at?: string
          gerado_por_user_id: string
          id?: string
          mes_referencia: string
        }
        Update: {
          company_id?: string
          created_at?: string
          gerado_por_user_id?: string
          id?: string
          mes_referencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_closings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          company_id: string
          created_at: string
          email: string
          id: string
          nome: string
          setor: string | null
          telefone: string | null
          tour_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          company_id: string
          created_at?: string
          email: string
          id?: string
          nome: string
          setor?: string | null
          telefone?: string | null
          tour_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          nome?: string
          setor?: string | null
          telefone?: string | null
          tour_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          company_id: string
          created_at: string
          dias_alerta_revisao_antecipado: number | null
          id: string
          manutencao_intervalo_km_padrao: number
          motivos_padrao: string[]
          permitir_edicao_km: boolean
          politica_de_uso: string | null
          rastreamento_ativo: boolean
          updated_at: string
          validacao_placa_ocr: boolean
          validacao_qrcode: boolean
          whatsapp_admin: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          dias_alerta_revisao_antecipado?: number | null
          id?: string
          manutencao_intervalo_km_padrao?: number
          motivos_padrao?: string[]
          permitir_edicao_km?: boolean
          politica_de_uso?: string | null
          rastreamento_ativo?: boolean
          updated_at?: string
          validacao_placa_ocr?: boolean
          validacao_qrcode?: boolean
          whatsapp_admin?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          dias_alerta_revisao_antecipado?: number | null
          id?: string
          manutencao_intervalo_km_padrao?: number
          motivos_padrao?: string[]
          permitir_edicao_km?: boolean
          politica_de_uso?: string | null
          rastreamento_ativo?: boolean
          updated_at?: string
          validacao_placa_ocr?: boolean
          validacao_qrcode?: boolean
          whatsapp_admin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      traffic_tickets: {
        Row: {
          company_id: string
          comprovante_foto: string | null
          created_at: string
          data_infracao: string
          descricao: string
          id: string
          local_infracao: string | null
          motorista_id: string | null
          numero_auto: string | null
          observacoes: string | null
          pontos: number | null
          registrado_por_user_id: string
          status: string
          updated_at: string
          valor: number
          veiculo_id: string
        }
        Insert: {
          company_id: string
          comprovante_foto?: string | null
          created_at?: string
          data_infracao: string
          descricao: string
          id?: string
          local_infracao?: string | null
          motorista_id?: string | null
          numero_auto?: string | null
          observacoes?: string | null
          pontos?: number | null
          registrado_por_user_id: string
          status?: string
          updated_at?: string
          valor?: number
          veiculo_id: string
        }
        Update: {
          company_id?: string
          comprovante_foto?: string | null
          created_at?: string
          data_infracao?: string
          descricao?: string
          id?: string
          local_infracao?: string | null
          motorista_id?: string | null
          numero_auto?: string | null
          observacoes?: string | null
          pontos?: number | null
          registrado_por_user_id?: string
          status?: string
          updated_at?: string
          valor?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traffic_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traffic_tickets_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_bookings: {
        Row: {
          ciente: boolean
          company_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          destino: string | null
          id: string
          motivo: string
          motorista_id: string
          notificado_dia: boolean
          notificado_vespera: boolean
          status: string
          updated_at: string
          veiculo_id: string
        }
        Insert: {
          ciente?: boolean
          company_id: string
          created_at?: string
          data_fim: string
          data_inicio: string
          destino?: string | null
          id?: string
          motivo: string
          motorista_id: string
          notificado_dia?: boolean
          notificado_vespera?: boolean
          status?: string
          updated_at?: string
          veiculo_id: string
        }
        Update: {
          ciente?: boolean
          company_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          destino?: string | null
          id?: string
          motivo?: string
          motorista_id?: string
          notificado_dia?: boolean
          notificado_vespera?: boolean
          status?: string
          updated_at?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_bookings_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          alerta_revisao_km_intervalo: number | null
          ano: number | null
          capacidade_tanque_litros: number | null
          company_id: string
          created_at: string
          data_ultima_revisao: string | null
          id: string
          km_atual: number
          km_ultima_revisao: number | null
          marca: string | null
          modelo: string | null
          observacoes: string | null
          placa: string
          prefixo: string | null
          proxima_revisao_km: number | null
          status: Database["public"]["Enums"]["vehicle_status"]
          tipo: Database["public"]["Enums"]["vehicle_type"]
          tipo_combustivel_padrao:
            | Database["public"]["Enums"]["fuel_type"]
            | null
          updated_at: string
        }
        Insert: {
          alerta_revisao_km_intervalo?: number | null
          ano?: number | null
          capacidade_tanque_litros?: number | null
          company_id: string
          created_at?: string
          data_ultima_revisao?: string | null
          id?: string
          km_atual?: number
          km_ultima_revisao?: number | null
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          placa: string
          prefixo?: string | null
          proxima_revisao_km?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          tipo?: Database["public"]["Enums"]["vehicle_type"]
          tipo_combustivel_padrao?:
            | Database["public"]["Enums"]["fuel_type"]
            | null
          updated_at?: string
        }
        Update: {
          alerta_revisao_km_intervalo?: number | null
          ano?: number | null
          capacidade_tanque_litros?: number | null
          company_id?: string
          created_at?: string
          data_ultima_revisao?: string | null
          id?: string
          km_atual?: number
          km_ultima_revisao?: number | null
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          placa?: string
          prefixo?: string | null
          proxima_revisao_km?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          tipo?: Database["public"]["Enums"]["vehicle_type"]
          tipo_combustivel_padrao?:
            | Database["public"]["Enums"]["fuel_type"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      update_vehicle_status_on_checkout: {
        Args: {
          _km?: number
          _new_status: Database["public"]["Enums"]["vehicle_status"]
          _vehicle_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "frota" | "motorista"
      checkout_status: "aberto" | "fechado" | "pendente_ajuste"
      fuel_type: "gasolina" | "etanol" | "diesel" | "outro"
      incident_status: "aberta" | "em_andamento" | "resolvida"
      incident_type:
        | "arranhao"
        | "amassado"
        | "pneu"
        | "mecanica"
        | "eletrica"
        | "multa"
        | "outro"
      maintenance_status: "agendada" | "realizada"
      severity_level: "leve" | "media" | "grave"
      vehicle_status: "disponivel" | "em_uso" | "manutencao" | "indisponivel"
      vehicle_type: "carro" | "moto" | "van" | "ambulancia" | "outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "frota", "motorista"],
      checkout_status: ["aberto", "fechado", "pendente_ajuste"],
      fuel_type: ["gasolina", "etanol", "diesel", "outro"],
      incident_status: ["aberta", "em_andamento", "resolvida"],
      incident_type: [
        "arranhao",
        "amassado",
        "pneu",
        "mecanica",
        "eletrica",
        "multa",
        "outro",
      ],
      maintenance_status: ["agendada", "realizada"],
      severity_level: ["leve", "media", "grave"],
      vehicle_status: ["disponivel", "em_uso", "manutencao", "indisponivel"],
      vehicle_type: ["carro", "moto", "van", "ambulancia", "outro"],
    },
  },
} as const
