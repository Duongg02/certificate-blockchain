import { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import "./App.css";
import {
  FaFileAlt,
  FaUsers,
  FaGraduationCap,
  FaQrcode,
  FaCube,
  FaSearch,
  FaPlusCircle,
  FaEye,
  FaDownload,
  FaCopy,
  FaSyncAlt,
  FaUser,
  FaBook,
  FaCalendarAlt,
} from "react-icons/fa";

const CONTRACT_ADDRESS = "0x58d5e7048188F0035AA9DEB9Cd64ED2b86B976CB";
const ADMIN_ADDRESS = "0xe61660e073E029c475E2cCb064FF6B1AdFAa15f1";
const ABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_studentName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_courseName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_issueDate",
        type: "string",
      },
    ],
    name: "addCertificate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "getCertificate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "certificateCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

function App() {
  const [studentName, setStudentName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [issueDate, setIssueDate] = useState("");

  const [searchId, setSearchId] = useState("");
  const [certificate, setCertificate] = useState(null);

  const [allCertificates, setAllCertificates] = useState([]);

  const [verifyMessage, setVerifyMessage] = useState("");

  const [account, setAccount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCertificates = allCertificates.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(allCertificates.length / itemsPerPage);
  const addCertificate = async () => {
    try {
      if (!isAdmin) {
        alert("Bạn không có quyền cấp chứng chỉ");
        return;
      }
      if (!window.ethereum) {
        alert("Cài MetaMask trước");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);

      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();

      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.addCertificate(
        studentName,
        courseName,
        issueDate,
      );

      alert("Đang gửi giao dịch...");
      setTxHash(tx.hash);

      await tx.wait();
      getTotalCertificates();

      alert("Thêm chứng chỉ thành công!");

      setStudentName("");
      setCourseName("");
      setIssueDate("");
    } catch (error) {
      console.log(error);
      alert("Có lỗi xảy ra");
    }
  };

  const searchCertificate = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);

      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);

      const result = await contract.getCertificate(searchId);

      // Kiểm tra chứng chỉ có tồn tại không
      if (Number(result[0]) === 0) {
        setCertificate(null);

        setVerifyMessage("❌ Chứng chỉ không tồn tại");

        return;
      }

      setCertificate({
        id: result[0].toString(),
        studentName: result[1],
        courseName: result[2],
        issueDate: result[3],
      });

      setVerifyMessage("✅ Chứng chỉ hợp lệ");
    } catch (error) {
      console.log(error);

      setCertificate(null);

      setVerifyMessage("❌ Chứng chỉ không tồn tại");
    }
  };
  const loadAllCertificates = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);

      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);

      const count = await contract.certificateCount();

      const list = [];

      for (let i = 1; i <= Number(count); i++) {
        const cert = await contract.getCertificate(i);

        list.push({
          id: cert[0].toString(),
          studentName: cert[1],
          courseName: cert[2],
          issueDate: cert[3],
        });
      }

      setAllCertificates(list);
    } catch (error) {
      console.log(error);
    }
  };
  const searchByStudentName = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
      const count = await contract.certificateCount();
      const results = [];

      for (let i = 1; i <= Number(count); i++) {
        const cert = await contract.getCertificate(i);
        const student = cert[1].toLowerCase();
        const keyword = searchName.toLowerCase();

        if (student.includes(keyword)) {
          results.push({
            id: cert[0].toString(),
            studentName: cert[1],
            courseName: cert[2],
            issueDate: cert[3],
          });
        }
      }

      setSearchResults(results);

      if (results.length === 0) {
        alert("Không tìm thấy chứng chỉ theo tên sinh viên");
      }
    } catch (error) {
      console.log(error);
      alert("Có lỗi khi tìm kiếm theo tên");
    }
  };
  const connectWallet = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
    try {
      if (!window.ethereum) {
        alert("Vui lòng cài MetaMask để kết nối ví");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      alert("Không thể kết nối MetaMask");
    }
  };
  const getTotalCertificates = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
      const count = await contract.certificateCount();
      setTotalCertificates(Number(count));
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    const init = async () => {
      await connectWallet();
      await getTotalCertificates();
    };

    init();
  }, []);
  const isAdmin = account.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  const downloadCertificatePDF = () => {
    if (!certificate) {
      alert("Chưa có chứng chỉ để tải");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("CERTIFICATE OF COMPLETION", 35, 30);

    doc.setFontSize(12);
    doc.text(`Certificate ID: ${certificate.id}`, 20, 55);
    doc.text(`Student Name: ${certificate.studentName}`, 20, 70);
    doc.text(`Course Name: ${certificate.courseName}`, 20, 85);
    doc.text(`Issue Date: ${certificate.issueDate}`, 20, 100);
    doc.text(`Contract Address: ${CONTRACT_ADDRESS}`, 20, 120);

    doc.save(`certificate_${certificate.id}.pdf`);
  };

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">⛓️</div>

          <div>
            <h1>CertificateChain</h1>
            <p>Blockchain Certificate Verification System</p>
          </div>
        </div>

        <div className="header-info">
          <div className="info-box">
            <span>Network</span>
            <p>Sepolia</p>
          </div>

          <div className="info-box">
            <span>Contract</span>
            <p>
              {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            </p>
          </div>

          <button className="connect-btn" onClick={connectWallet}>
            {account
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect Wallet"}
          </button>

          <div className="role-badge">
            {account ? (
              <span className={isAdmin ? "admin-badge" : "user-badge"}>
                {isAdmin ? "Admin" : "User"}
              </span>
            ) : (
              <span className="user-badge">Guest</span>
            )}
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card">
          <FaFileAlt className="stat-icon" />
          <h2>{totalCertificates}</h2>
          <p>Tổng số chứng chỉ</p>
        </div>

        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <h2>{allCertificates.length || totalCertificates}</h2>
          <p>Tổng số sinh viên</p>
        </div>

        <div className="stat-card">
          <FaGraduationCap className="stat-icon" />
          <h2>{totalCertificates}</h2>
          <p>Chứng chỉ đã cấp</p>
        </div>

        <div className="stat-card">
          <FaQrcode className="stat-icon" />
          <h2>{certificate ? 1 : 0}</h2>
          <p>QR Code đã tạo</p>
        </div>

        <div className="stat-card">
          <FaCube className="stat-icon" />
          <h2>Sepolia</h2>
          <p>Ethereum Blockchain</p>
        </div>
      </div>
      <div className="grid">
        <div className="card">
          <h2>
            <FaPlusCircle /> Thêm chứng chỉ
          </h2>

          <div className="form-group">
            <label>Tên sinh viên</label>
            <div className="input-icon">
              <FaUser />

              <input
                type="text"
                placeholder="Nhập tên sinh viên"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tên khóa học</label>
            <div className="input-icon">
              <FaBook />

              <input
                type="text"
                placeholder="Nhập tên khóa học"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Ngày cấp</label>
            <div className="input-icon">
              <FaCalendarAlt />

              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
          </div>

          <button className="add-btn" onClick={addCertificate}>
            <FaPlusCircle /> Thêm chứng chỉ
          </button>
          {txHash && (
            <p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                Xem giao dịch trên Etherscan
              </a>
            </p>
          )}

          <hr
            style={{
              marginTop: "30px",
              marginBottom: "30px",
            }}
          />
        </div>

        <div className="card search-card">
          <h2>
            <FaSearch /> Tra cứu chứng chỉ
          </h2>

          <div className="search-section">
            <label>Tra cứu theo mã chứng chỉ</label>

            <input
              type="number"
              placeholder="Nhập ID chứng chỉ..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />

            <button className="search-btn" onClick={searchCertificate}>
              <FaSearch /> Tìm kiếm
            </button>
          </div>

          <div className="search-divider"></div>

          <div className="search-section">
            <label>Tìm kiếm theo tên sinh viên</label>

            <input
              type="text"
              placeholder="Nhập tên sinh viên..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />

            <button className="name-btn" onClick={searchByStudentName}>
              <FaUsers /> Tìm theo tên
            </button>
          </div>

          {verifyMessage && (
            <div
              className={
                verifyMessage.includes("✅")
                  ? "verify-box success-box"
                  : "verify-box error-box"
              }
            >
              {verifyMessage}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mini-result">
              <h4>Kết quả theo tên</h4>

              {searchResults.map((cert) => (
                <div
                  className="mini-cert"
                  key={cert.id}
                  onClick={() => {
                    setCertificate(cert);
                    setVerifyMessage("✅ Chứng chỉ hợp lệ");
                  }}
                >
                  <span>#{cert.id}</span>

                  <div>
                    <b>{cert.studentName}</b>
                    <p>{cert.courseName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h2>
            <FaFileAlt /> Danh sách chứng chỉ
          </h2>

          <button onClick={loadAllCertificates}>Tải danh sách</button>

          {allCertificates.length > 0 && (
            <table className="cert-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sinh viên</th>
                  <th>Khóa học</th>
                  <th>Ngày cấp</th>
                  <th>Xem</th>
                </tr>
              </thead>

              <tbody>
                {currentCertificates.map((cert) => (
                  <tr key={cert.id}>
                    <td>{cert.id}</td>
                    <td>{cert.studentName}</td>
                    <td>{cert.courseName}</td>
                    <td>{cert.issueDate}</td>
                    <td>
                      <button
                        className="eye-btn"
                        onClick={() => {
                          setCertificate(cert);
                          setVerifyMessage("✅ Chứng chỉ hợp lệ");
                        }}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Trang trước
        </button>

        <span>
          Trang {currentPage} / {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Trang sau
        </button>
      </div>

      {certificate && (
        <div className="result-box">
          <div className="certificate-info">
            <h3>Kết quả chứng chỉ</h3>

            <div className="info-grid">
              <div>
                <span>ID</span>
                <p>{certificate.id}</p>
              </div>

              <div>
                <span>Sinh viên</span>
                <p>{certificate.studentName}</p>
              </div>

              <div>
                <span>Khóa học</span>
                <p>{certificate.courseName}</p>
              </div>

              <div>
                <span>Ngày cấp</span>
                <p>{certificate.issueDate}</p>
              </div>
            </div>

            <p className="success">✅ Chứng chỉ hợp lệ</p>
          </div>

          <div className="qr-box">
            <h4>QR Code xác thực</h4>
            <QRCodeSVG
              value={`Certificate ID: ${certificate.id} - Student: ${certificate.studentName} - Course: ${certificate.courseName} - Date: ${certificate.issueDate}`}
              size={170}
            />
          </div>

          <div className="action-box">
            <button className="pdf-btn" onClick={downloadCertificatePDF}>
              <FaDownload /> Tải PDF
            </button>
            <button
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(certificate.id)}
            >
              <FaCopy /> Sao chép ID
            </button>

            <button
              className="refresh-btn"
              onClick={() => setCertificate(null)}
            >
              <FaSyncAlt /> Làm mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
