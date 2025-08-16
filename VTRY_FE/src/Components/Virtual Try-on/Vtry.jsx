import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { Row, Col, Card, Typography, Upload, Button } from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import { backend_url } from '../../App';

const { Title, Text } = Typography;

const VirtualTryOn = () => {
    const location = useLocation();
    const [modelFile, setModelFile] = useState(null);
    const [modelFileList, setModelFileList] = useState([]);
    const [garmentFile] = useState(null);
    const [modelPreview, setModelPreview] = useState('');
    const [garmentPreview, setGarmentPreview] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const garmentUrl = location.state?.garmentUrl;
        if (garmentUrl) {
            setGarmentPreview(garmentUrl);
        }
    }, [location.state]);

    const handleModelChange = ({ fileList }) => {
        const file = fileList[0]?.originFileObj;
        setModelFileList(fileList);
        if (file) {
            setModelFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setModelPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!modelFile || (!garmentFile && !garmentPreview)) {
            alert('Vui lòng chọn cả ảnh người mẫu và ảnh quần áo!');
            return;
        }

        const formData = new FormData();
        formData.append('model', modelFile);

        if (garmentFile) {
            formData.append('garment', garmentFile);
        } else {
            try {
                const response = await fetch(garmentPreview);
                const blob = await response.blob();
                const filename = garmentPreview.split('/').pop();
                const fileFromUrl = new File([blob], filename || 'garment.jpg', { type: blob.type });
                formData.append('garment', fileFromUrl);
            } catch (error) {
                alert('Không thể tải ảnh quần áo từ URL!');
                return;
            }
        }

        try {
            setLoading(true);
            setPreviewUrl('');
            const res = await axios.post(`${backend_url}/tryon`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.outputUrl) {
                setPreviewUrl(res.data.outputUrl);
            } else {
                alert('Thử đồ chưa hoàn tất, vui lòng thử lại!');
            }
        } catch (err) {
            console.error(err);
            alert('Có lỗi xảy ra trong quá trình thử đồ!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', background: '#f7f5f0' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>AI VIRTUAL TRY ON 👗</Title>
            <form onSubmit={handleSubmit}>
                <Row justify="center" gutter={24}>
                    <Col xs={24} md={10}>
                        <Card title="Select Model" variant="outlined" style={{ background: '#fff3e0' }}>
                            <div style={{ textAlign: 'center' }}>
                                {modelPreview ? (
                                    <img src={modelPreview} alt="Model Preview" style={{ maxHeight: 300, marginBottom: 10 }} />
                                ) : (
                                    <Text type="secondary">Chưa chọn ảnh</Text>
                                )}
                                <Upload
                                    showUploadList={false}
                                    beforeUpload={() => false}
                                    onChange={handleModelChange}
                                    fileList={modelFileList}
                                >
                                    <Button icon={<UploadOutlined />} style={{ marginTop: 12 }}>Choose file</Button>
                                </Upload>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} md={10}>
                        <Card title="Select Garment" variant="outlined" style={{ background: '#fff3e0' }}>
                            <div style={{ textAlign: 'center' }}>
                                {garmentPreview ? (
                                    <img src={garmentPreview} alt="Garment Preview" style={{ maxHeight: 300, marginBottom: 10 }} />
                                ) : (
                                    <Text type="secondary">Chưa chọn ảnh</Text>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Row justify="center" style={{ marginTop: 32 }}>
                    <Col>
                        <Button type="primary" htmlType="submit" disabled={loading} icon={loading ? <LoadingOutlined spin /> : null}>
                            {loading ? 'Đang xử lý...' : 'TRY ON NOW'}
                        </Button>
                    </Col>
                </Row>
            </form>

            {previewUrl && (
                <Row justify="center" style={{ marginTop: 40 }}>
                    <Col>
                        <Card title="Kết quả thử đồ 🎉" variant="outlined" style={{ background: '#fefefe' }}>
                            <img
                                src={previewUrl}
                                alt="Virtual Try-On Result"
                                style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #ddd' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default VirtualTryOn;
