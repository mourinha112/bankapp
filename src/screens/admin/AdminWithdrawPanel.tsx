// Exemplo de painel admin para gerenciar saques manuais

interface WithdrawRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  bankName: string;
  bankCode: string;
  agency: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  cpf: string;
  accountHolderName: string;
  requestDate: Date;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  adminNotes?: string;
}

// PAINEL ADMIN - Gerenciar Saques
export default function AdminWithdrawPanel() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  
  const handleApprove = async (requestId: string) => {
    // 1. Admin aprova o saque
    // 2. Sistema gera instruções para PIX
    // 3. Admin faz PIX manual no banco
    Alert.alert(
      'Saque Aprovado',
      'Faça o PIX manual e depois marque como "Completado"'
    );
  };
  
  const handleComplete = async (requestId: string) => {
    // 1. Admin confirma que fez o PIX
    // 2. Sistema debita o saldo do usuário
    // 3. Marca como completado
    const request = requests.find(r => r.id === requestId);
    if (request) {
      await debitUserBalance(request.userId, request.amount);
      updateRequestStatus(requestId, 'completed');
    }
  };
  
  return (
    <View>
      <Text>🏦 Painel Admin - Saques Pendentes</Text>
      {requests.map(request => (
        <View key={request.id} style={styles.requestCard}>
          <Text>💰 R$ {request.amount}</Text>
          <Text>👤 {request.userEmail}</Text>
          <Text>🏦 {request.bankName} - {request.agency}/{request.accountNumber}</Text>
          <Text>📄 CPF: {request.cpf}</Text>
          <Text>📅 {request.requestDate.toLocaleDateString()}</Text>
          
          {request.status === 'pending' && (
            <TouchableOpacity onPress={() => handleApprove(request.id)}>
              <Text>✅ Aprovar</Text>
            </TouchableOpacity>
          )}
          
          {request.status === 'approved' && (
            <TouchableOpacity onPress={() => handleComplete(request.id)}>
              <Text>✅ PIX Enviado - Marcar como Pago</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}